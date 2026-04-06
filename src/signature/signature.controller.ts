import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    Res,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DemoGuard } from '../auth/guards/demo.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SignatureService } from './signature.service';
import { GenerateCodesDto } from '../dto/generate-codes.dto';
import { GenerateQRDto } from '../dto/generate-qr.dto';
import { AddBalanceDirectDto } from '../dto/add-balance-direct.dto';
import { RedeemCodeDto } from '../dto/redeem-code.dto';
import { RedeemQRDto } from '../dto/redeem-qr.dto';
import { UserRole } from '../entity/user.entity';

@Controller('signature')
export class SignatureController {
    constructor(private readonly signatureService: SignatureService) { }


    @Post('generate-codes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async generateCodes(@Req() req, @Body() dto: GenerateCodesDto, @Res() res: Response) {
        const userId = req.user.userId;
        const result = await this.signatureService.generateCodes(userId, dto);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="codes_${result.eventId}.pdf"`);
        res.send(result.pdfBuffer);
    }

    @Post('generate-qr')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async generateQR(@Req() req, @Body() dto: GenerateQRDto, @Res() res: Response) {
        const userId = req.user.userId;
        const result = await this.signatureService.generateQR(userId, dto);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="qr_${result.qrId}.png"`);
        res.send(result.pngBuffer);
    }

    @Post('add-balance-direct')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async addBalanceDirect(@Req() req, @Body() dto: AddBalanceDirectDto) {
        const userId = req.user.userId;
        return this.signatureService.addBalanceDirect(userId, dto);
    }


    @Post('redeem-code')
    @UseGuards(JwtAuthGuard, DemoGuard)
    async redeemCode(@Req() req, @Body() dto: RedeemCodeDto) {
        const userId = req.user.userId;
        return this.signatureService.redeemCode(userId, dto);
    }

    @Post('redeem-qr')
    @UseGuards(JwtAuthGuard, DemoGuard)
    async redeemQR(@Req() req, @Body() dto: RedeemQRDto) {
        const userId = req.user.userId;
        return this.signatureService.redeemQR(userId, dto);
    }


    @Get('my-codes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async getMyCodes(@Req() req, @Query('webshopId') webshopId?: string) {
        const userId = req.user.userId;
        const shopId = webshopId ? parseInt(webshopId, 10) : undefined;
        return this.signatureService.getTeacherCodes(userId, shopId);
    }

    @Get('my-qrs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async getMyQRs(@Req() req, @Query('webshopId') webshopId?: string) {
        const userId = req.user.userId;
        const shopId = webshopId ? parseInt(webshopId, 10) : undefined;
        return this.signatureService.getTeacherQRs(userId, shopId);
    }

    @Get('students')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async getAllStudents() {
        return this.signatureService.getAllStudents();
    }


    @Delete('code/:codeId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async deleteCode(@Req() req, @Param('codeId') codeId: string) {
        const userId = req.user.userId;
        return this.signatureService.deleteCode(userId, parseInt(codeId, 10));
    }

    @Delete('qr/:qrId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    async deleteQR(@Req() req, @Param('qrId') qrId: string) {
        const userId = req.user.userId;
        return this.signatureService.deleteQR(userId, parseInt(qrId, 10));
    }
}