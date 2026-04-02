import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entity/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Webshop } from '../entity/webshop.entity';
import { WebshopPartner } from '../entity/webshop-partner.entity';
import { UserRole } from '../entity/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Webshop)
    private webshopRepository: Repository<Webshop>,
    @InjectRepository(WebshopPartner)
    private webshopPartnerRepository: Repository<WebshopPartner>,
  ) { }

  async createProduct(
    userId: number,
    userRole: UserRole,
    createProductDto: CreateProductDto
  ): Promise<Product> {
    const { webshop_id, name, category, image, description, price, max_stock, current_stock, status } = createProductDto;

    const webshop = await this.webshopRepository.findOne({
      where: { webshop_id: webshop_id },
    });

    if (!webshop) {
      throw new NotFoundException(`Webshop with ID ${webshop_id} not found`);
    }

    console.log('=== PRODUCT CREATE ACCESS CHECK ===');
    console.log('User ID from JWT:', userId, 'Type:', typeof userId);
    console.log('User Role:', userRole);
    console.log('Webshop teacher_id (owner):', webshop.teacher_id, 'Type:', typeof webshop.teacher_id);
    console.log('======================================');

    await this.checkWebshopAccess(webshop_id, userId, userRole, 'create product');

    if (current_stock > max_stock) {
      throw new BadRequestException('A jelenlegi készlet nem lehet nagyobb, mint a maximális készlet');
    }

    const newProduct = this.productRepository.create({
      name,
      category,
      image,
      description,
      price,
      max_stock,
      current_stock,
      status,
      webshop: webshop,
    });

    return await this.productRepository.save(newProduct);
  }

  async updateProduct(
    userId: number,
    userRole: UserRole,
    productId: number,
    updateProductDto: UpdateProductDto
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: productId },
      relations: ['webshop']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    await this.checkWebshopAccess(product.webshop.webshop_id, userId, userRole, 'update product');

    const newMaxStock = updateProductDto.max_stock ?? product.max_stock;
    const newCurrentStock = updateProductDto.current_stock ?? product.current_stock;

    if (newCurrentStock > newMaxStock) {
      throw new BadRequestException('A jelenlegi készlet nem lehet nagyobb, mint a maximális készlet');
    }

    Object.assign(product, updateProductDto);

    return await this.productRepository.save(product);
  }

  async deleteProduct(
    userId: number,
    userRole: UserRole,
    productId: number
  ): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({
      where: { product_id: productId },
      relations: ['webshop']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    await this.checkWebshopAccess(product.webshop.webshop_id, userId, userRole, 'delete product');

    await this.productRepository.remove(product);

    return { message: 'Termék sikeresen törölve' };
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id },
      relations: ['webshop'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getProductsByWebshop(webshopId: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: { webshop: { webshop_id: webshopId } },
      relations: ['webshop'],
      order: { upload_date: 'DESC' },
    });
  }

  async decreaseStock(productId: number, quantity: number): Promise<Product> {
    const product = await this.getProduct(productId);

    if (product.current_stock < quantity) {
      throw new BadRequestException(
        `Nincs elég készlet a termékből: ${product.name}. Elérhető: ${product.current_stock}, kért: ${quantity}`
      );
    }

    product.current_stock -= quantity;

    if (product.current_stock === 0) {
      product.status = 'unavailable';
    }

    return await this.productRepository.save(product);
  }

  async increaseStock(productId: number, quantity: number): Promise<Product> {
    const product = await this.getProduct(productId);

    product.current_stock += quantity;

    if (product.current_stock > 0 && product.status === 'unavailable') {
      product.status = 'available';
    }

    return await this.productRepository.save(product);
  }

  private async checkWebshopAccess(
    webshopId: number,
    userId: number,
    userRole: UserRole,
    action: string
  ): Promise<void> {
    if (userRole === UserRole.ADMIN) {
      console.log(`✅ Access granted for ${action}: ADMIN role`);
      return;
    }

    const webshop = await this.webshopRepository.findOne({
      where: { webshop_id: webshopId }
    });

    if (!webshop) {
      throw new NotFoundException(`Webshop with ID ${webshopId} not found`);
    }

    if (webshop.teacher_id === userId) {
      console.log(`✅ Access granted for ${action}: User is OWNER`);
      return;
    }

    const isPartner = await this.webshopPartnerRepository.findOne({
      where: {
        webshop_id: webshopId,
        partner_teacher_id: userId
      }
    });

    if (isPartner) {
      console.log(`✅ Access granted for ${action}: User is PARTNER`);
      return;
    }

    console.error(`❌ Access denied for ${action}: User is neither owner, partner, nor admin`);
    throw new ForbiddenException(`Nincs jogosultságod ehhez a művelethez. Csak a webshop tulajdonosa, partnerei vagy admin ${action.includes('create') ? 'hozhat létre' : action.includes('update') ? 'módosíthat' : 'törölhet'} terméket.`);
  }
  
  private async checkProductOwnership(
    productId: number,
    userId: number,
    userRole: UserRole
  ): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { product_id: productId },
      relations: ['webshop']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    await this.checkWebshopAccess(product.webshop.webshop_id, userId, userRole, 'manage product');
  }
}