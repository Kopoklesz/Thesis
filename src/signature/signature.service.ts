import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SignatureGenerationEvent, GenerationType } from '../entity/signature-generation-event.entity';
import { SignatureCode } from '../entity/signature-code.entity';
import { SignatureQR } from '../entity/signature-qr.entity';
import { SignatureQRActivation } from '../entity/signature-qr-activation.entity';
import { Webshop } from '../entity/webshop.entity';
import { User, UserRole } from '../entity/user.entity';
import { UserBalance } from '../entity/user-balance.entity';
import { WebshopPartner } from '../entity/webshop-partner.entity';
import { GenerateCodesDto } from '../dto/generate-codes.dto';
import { GenerateQRDto } from '../dto/generate-qr.dto';
import { AddBalanceDirectDto } from '../dto/add-balance-direct.dto';
import { RedeemCodeDto } from '../dto/redeem-code.dto';
import { RedeemQRDto } from '../dto/redeem-qr.dto';
import * as crypto from 'crypto';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class SignatureService {
    constructor(
        @InjectRepository(SignatureGenerationEvent)
        private eventRepository: Repository<SignatureGenerationEvent>,
        @InjectRepository(SignatureCode)
        private codeRepository: Repository<SignatureCode>,
        @InjectRepository(SignatureQR)
        private qrRepository: Repository<SignatureQR>,
        @InjectRepository(SignatureQRActivation)
        private qrActivationRepository: Repository<SignatureQRActivation>,
        @InjectRepository(Webshop)
        private webshopRepository: Repository<Webshop>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserBalance)
        private userBalanceRepository: Repository<UserBalance>,
        @InjectRepository(WebshopPartner)
        private partnerRepository: Repository<WebshopPartner>,
        private dataSource: DataSource,
    ) { }


    private async checkWebshopPermission(userId: number, webshopId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { user_id: userId } });

        if (user.role === 'admin') {
            return;
        }

        const webshop = await this.webshopRepository.findOne({ where: { webshop_id: webshopId } });

        if (!webshop) {
            throw new NotFoundException('Webshop nem található');
        }

        if (webshop.teacher_id === userId) {
            return;
        }

        const isPartner = await this.partnerRepository.findOne({
            where: {
                webshop_id: webshopId,
                partner_teacher_id: userId,
            },
        });

        if (!isPartner) {
            throw new ForbiddenException('Nincs jogosultságod ehhez a webshophoz');
        }
    }


    private generateUniqueCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        const bytes = crypto.randomBytes(8);

        for (let i = 0; i < 8; i++) {
            code += chars[bytes[i] % chars.length];
        }

        return code;
    }

    async generateCodes(userId: number, dto: GenerateCodesDto): Promise<any> {
        await this.checkWebshopPermission(userId, dto.webshopId);

        const expiryDate = new Date(dto.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate <= today) {
            throw new BadRequestException('A lejárati dátumnak jövőbeli dátumnak kell lennie');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const event = this.eventRepository.create({
                webshop_id: dto.webshopId,
                teacher_id: userId,
                generation_type: GenerationType.CODE,
                total_codes: dto.codeCount,
                code_value: dto.codeValue,
                expiry_date: expiryDate,
            });

            const savedEvent = await queryRunner.manager.save(event);

            const codes: SignatureCode[] = [];
            const generatedCodes: string[] = [];

            for (let i = 0; i < dto.codeCount; i++) {
                let uniqueCode: string;
                let attempts = 0;
                const maxAttempts = 100;

                do {
                    uniqueCode = this.generateUniqueCode();
                    attempts++;

                    if (attempts > maxAttempts) {
                        throw new Error('Nem sikerült egyedi kódot generálni');
                    }
                } while (
                    generatedCodes.includes(uniqueCode) ||
                    (await this.codeRepository.findOne({ where: { code: uniqueCode } }))
                );

                generatedCodes.push(uniqueCode);

                const code = this.codeRepository.create({
                    event_id: savedEvent.event_id,
                    code: uniqueCode,
                });

                codes.push(code);
            }

            await queryRunner.manager.save(codes);
            await queryRunner.commitTransaction();

            const webshop = await this.webshopRepository.findOne({ where: { webshop_id: dto.webshopId } });
            const pdfBuffer = await this.generateCodesPDF(generatedCodes, webshop, dto.codeValue, expiryDate);

            return {
                success: true,
                message: `${dto.codeCount} kód sikeresen generálva`,
                eventId: savedEvent.event_id,
                pdfBuffer: pdfBuffer,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async generateCodesPDF(codes: string[], webshop: Webshop, value: number, expiryDate: Date): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(20)
                .fillColor(webshop.header_color_code)
                .text(webshop.subject_name, { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(12)
                .fillColor('#000000')
                .text(`Pénznem: ${webshop.paying_instrument}`, { align: 'center' });

            doc.text(`Érték: ${value} ${webshop.paying_instrument}`, { align: 'center' });
            doc.text(`Érvényes: ${expiryDate.toLocaleDateString('hu-HU')}`, { align: 'center' });

            doc.moveDown(2);

            doc.fontSize(14).fillColor('#000000').text('Beváltható Kódok:', { underline: true });
            doc.moveDown(1);

            codes.forEach((code, index) => {
                doc.fontSize(16)
                    .font('Courier')
                    .text(`${index + 1}. ${code}`, { align: 'left' });
                doc.moveDown(0.5);

                if ((index + 1) % 15 === 0 && index + 1 < codes.length) {
                    doc.addPage();
                    doc.fontSize(20)
                        .fillColor(webshop.header_color_code)
                        .text(webshop.subject_name, { align: 'center' });
                    doc.moveDown(2);
                }
            });

            doc.end();
        });
    }


    async generateQR(userId: number, dto: GenerateQRDto): Promise<any> {
        await this.checkWebshopPermission(userId, dto.webshopId);

        const expiryDate = new Date(dto.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate <= today) {
            throw new BadRequestException('A lejárati dátumnak jövőbeli dátumnak kell lennie');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const event = this.eventRepository.create({
                webshop_id: dto.webshopId,
                teacher_id: userId,
                generation_type: GenerationType.QR,
                total_codes: dto.maxActivations,
                code_value: dto.codeValue,
                expiry_date: expiryDate,
            });

            const savedEvent = await queryRunner.manager.save(event);

            const qrToken = crypto.randomBytes(32).toString('hex');

            const qr = this.qrRepository.create({
                event_id: savedEvent.event_id,
                qr_data: qrToken,
                max_activations: dto.maxActivations,
                current_activations: 0,
                is_active: true,
            });

            const savedQR = await queryRunner.manager.save(qr);
            await queryRunner.commitTransaction();

            const webshop = await this.webshopRepository.findOne({ where: { webshop_id: dto.webshopId } });
            const pngBuffer = await this.generateQRImage(qrToken, webshop, dto.codeValue, expiryDate, dto.maxActivations);

            return {
                success: true,
                message: 'QR kód sikeresen generálva',
                eventId: savedEvent.event_id,
                qrId: savedQR.qr_id,
                qrData: qrToken,
                pngBuffer: pngBuffer,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async generateQRImage(
        qrData: string,
        webshop: Webshop,
        value: number,
        expiryDate: Date,
        maxActivations: number,
    ): Promise<Buffer> {
        const qrImageUrl = await QRCode.toDataURL(qrData, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        const base64Data = qrImageUrl.replace(/^data:image\/png;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }

    async addBalanceDirect(userId: number, dto: AddBalanceDirectDto): Promise<any> {
        await this.checkWebshopPermission(userId, dto.webshopId);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const event = this.eventRepository.create({
                webshop_id: dto.webshopId,
                teacher_id: userId,
                generation_type: GenerationType.DIRECT,
                total_codes: dto.userIds.length,
                code_value: dto.amount,
                expiry_date: new Date(),
            });

            await queryRunner.manager.save(event);

            for (const targetUserId of dto.userIds) {
                let balance = await queryRunner.manager.findOne(UserBalance, {
                    where: {
                        user: { user_id: targetUserId },
                        webshop: { webshop_id: dto.webshopId },
                    },
                });

                if (balance) {
                    balance.amount = parseFloat(balance.amount.toString()) + dto.amount;
                    await queryRunner.manager.save(balance);
                } else {
                    balance = queryRunner.manager.create(UserBalance, {
                        user: { user_id: targetUserId } as User,
                        webshop: { webshop_id: dto.webshopId } as any,
                        amount: dto.amount,
                    });
                    await queryRunner.manager.save(balance);
                }
            }

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: `Egyenleg sikeresen hozzáadva ${dto.userIds.length} hallgatónak`,
                affectedUsers: dto.userIds.length,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async redeemCode(userId: number, dto: RedeemCodeDto): Promise<any> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        try {
            const code = await queryRunner.manager.findOne(SignatureCode, {
                where: { code: dto.code, is_redeemed: false },
                relations: ['event', 'event.webshop'],
                lock: { mode: 'pessimistic_write' },
            });

            if (!code) {
                throw new NotFoundException('A kód nem található vagy már beváltották');
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(code.event.expiry_date);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
                await queryRunner.manager.remove(code);
                await queryRunner.commitTransaction();
                throw new BadRequestException('A kód lejárt');
            }

            let balance = await queryRunner.manager.findOne(UserBalance, {
                where: {
                    user: { user_id: userId },
                    webshop: { webshop_id: code.event.webshop_id },
                },
            });

            if (balance) {
                balance.amount = parseFloat(balance.amount.toString()) + parseFloat(code.event.code_value.toString());
                await queryRunner.manager.save(balance);
            } else {
                balance = queryRunner.manager.create(UserBalance, {
                    user: { user_id: targetUserId } as User,
                    webshop: { webshop_id: dto.webshopId } as any,
                    amount: code.event.code_value,
                });
                await queryRunner.manager.save(balance);
            }

            await queryRunner.manager.remove(code);

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: 'Kód sikeresen beváltva',
                value: code.event.code_value,
                webshop: code.event.webshop.subject_name,
                currency: code.event.webshop.paying_instrument,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async redeemQR(userId: number, dto: RedeemQRDto): Promise<any> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        try {
            const qr = await queryRunner.manager.findOne(SignatureQR, {
                where: { qr_data: dto.qrData, is_active: true },
                relations: ['event', 'event.webshop'],
                lock: { mode: 'pessimistic_write' },
            });

            if (!qr) {
                throw new NotFoundException('A QR kód nem található vagy már nem aktív');
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(qr.event.expiry_date);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
                throw new BadRequestException('A QR kód lejárt');
            }

            if (qr.current_activations >= qr.max_activations) {
                throw new BadRequestException('A QR kód elérte a maximális aktiválási limitet');
            }

            const existingActivation = await queryRunner.manager.findOne(SignatureQRActivation, {
                where: {
                    qr_id: qr.qr_id,
                    user_id: userId,
                },
            });

            if (existingActivation) {
                throw new BadRequestException('Már aktiváltad ezt a QR kódot');
            }

            let balance = await queryRunner.manager.findOne(UserBalance, {
                where: {
                    user: { user_id: userId },
                    webshop: { webshop_id: qr.event.webshop_id },
                },
            });

            if (balance) {
                balance.amount = parseFloat(balance.amount.toString()) + parseFloat(qr.event.code_value.toString());
                await queryRunner.manager.save(balance);
            } else {
                balance = queryRunner.manager.create(UserBalance, {
                    user: { user_id: targetUserId } as User,
                    webshop: { webshop_id: dto.webshopId } as any,
                    amount: qr.event.code_value,
                });
                await queryRunner.manager.save(balance);
            }

            const activation = queryRunner.manager.create(SignatureQRActivation, {
                qr_id: qr.qr_id,
                user_id: userId,
            });
            await queryRunner.manager.save(activation);

            qr.current_activations++;

            if (qr.current_activations >= qr.max_activations) {
                qr.is_active = false;
            }

            await queryRunner.manager.save(qr);

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: 'QR kód sikeresen aktiválva',
                value: qr.event.code_value,
                webshop: qr.event.webshop.subject_name,
                currency: qr.event.webshop.paying_instrument,
                remainingActivations: qr.max_activations - qr.current_activations,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getTeacherCodes(userId: number, webshopId?: number): Promise<any> {
        const whereCondition: any = {
            teacher_id: userId,
            generation_type: GenerationType.CODE,
        };

        if (webshopId) {
            await this.checkWebshopPermission(userId, webshopId);
            whereCondition.webshop_id = webshopId;
        }

        const events = await this.eventRepository.find({
            where: whereCondition,
            relations: ['webshop', 'codes'],
            order: { created_at: 'DESC' },
        });

        return events.map((event) => ({
            eventId: event.event_id,
            webshopName: event.webshop.subject_name,
            webshopId: event.webshop_id,
            totalCodes: event.total_codes,
            codeValue: event.code_value,
            expiryDate: event.expiry_date,
            createdAt: event.created_at,
            codes: event.codes.map((code) => ({
                codeId: code.code_id,
                code: code.code,
                isRedeemed: code.is_redeemed,
                redeemedBy: code.redeemed_by,
                redeemedAt: code.redeemed_at,
            })),
        }));
    }

    async getTeacherQRs(userId: number, webshopId?: number): Promise<any> {
        const whereCondition: any = {
            teacher_id: userId,
            generation_type: GenerationType.QR,
        };

        if (webshopId) {
            await this.checkWebshopPermission(userId, webshopId);
            whereCondition.webshop_id = webshopId;
        }

        const events = await this.eventRepository.find({
            where: whereCondition,
            relations: ['webshop', 'qrs', 'qrs.activations', 'qrs.activations.user'],
            order: { created_at: 'DESC' },
        });

        return events.map((event) => ({
            eventId: event.event_id,
            webshopName: event.webshop.subject_name,
            webshopId: event.webshop_id,
            codeValue: event.code_value,
            expiryDate: event.expiry_date,
            createdAt: event.created_at,
            qrs: event.qrs.map((qr) => ({
                qrId: qr.qr_id,
                qrData: qr.qr_data,
                maxActivations: qr.max_activations,
                currentActivations: qr.current_activations,
                isActive: qr.is_active,
                activations: qr.activations.map((act) => ({
                    username: act.user.username,
                    email: act.user.email,
                    activatedAt: act.activated_at,
                })),
            })),
        }));
    }

    async getAllStudents(): Promise<User[]> {
        return this.userRepository.find({
            where: { role: UserRole.STUDENT },
            select: ['user_id', 'username', 'email'],
            order: { username: 'ASC' },
        });
    }

    async deleteCode(userId: number, codeId: number): Promise<any> {
        const code = await this.codeRepository.findOne({
            where: { code_id: codeId },
            relations: ['event'],
        });

        if (!code) {
            throw new NotFoundException('Kód nem található');
        }

        await this.checkWebshopPermission(userId, code.event.webshop_id);

        await this.codeRepository.remove(code);

        return {
            success: true,
            message: 'Kód sikeresen törölve',
        };
    }

    async deleteQR(userId: number, qrId: number): Promise<any> {
        const qr = await this.qrRepository.findOne({
            where: { qr_id: qrId },
            relations: ['event'],
        });

        if (!qr) {
            throw new NotFoundException('QR kód nem található');
        }

        await this.checkWebshopPermission(userId, qr.event.webshop_id);

        await this.qrRepository.remove(qr);

        return {
            success: true,
            message: 'QR kód sikeresen törölve',
        };
    }

    async cleanupExpiredCodes(): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredEvents = await this.eventRepository.find({
            where: {},
            relations: ['codes', 'qrs'],
        });

        let deletedCodesCount = 0;
        let deletedQRsCount = 0;

        for (const event of expiredEvents) {
            const expiryDate = new Date(event.expiry_date);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
                if (event.codes && event.codes.length > 0) {
                    await this.codeRepository.remove(event.codes);
                    deletedCodesCount += event.codes.length;
                }

                if (event.qrs && event.qrs.length > 0) {
                    await this.qrRepository.remove(event.qrs);
                    deletedQRsCount += event.qrs.length;
                }

                await this.eventRepository.remove(event);
            }
        }

        console.log(`✅ Cleanup kész: ${deletedCodesCount} kód és ${deletedQRsCount} QR törölve`);

        return {
            deletedCodes: deletedCodesCount,
            deletedQRs: deletedQRsCount,
        };
    }
}