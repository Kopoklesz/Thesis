import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase } from '../entity/purchase.entity';
import { CartService } from '../cart/cart.service';
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    private cartService: CartService,
    private userService: UserService,
    private productService: ProductService,
    private dataSource: DataSource,
  ) { }

  async createPurchase(userId: number, webshopId: number): Promise<{
    purchases: Purchase[];
    totalAmount: number;
    message: string;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cart = await this.cartService.getCart(userId, webshopId);

      if (!cart || cart.items.length === 0) {
        throw new NotFoundException('A kosár üres');
      }

      const totalAmount = cart.items.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
      }, 0);

      const currentBalance = await this.userService.getUserBalance(userId, webshopId);

      if (currentBalance < totalAmount) {
        throw new BadRequestException(
          `Nincs elég egyenleged. Szükséges: ${totalAmount.toFixed(2)}, Elérhető: ${currentBalance.toFixed(2)}`
        );
      }

      for (const item of cart.items) {
        const product = await this.productService.getProduct(item.product.product_id);

        if (product.current_stock < item.quantity) {
          throw new BadRequestException(
            `Nincs elég készlet a termékből: ${product.name}. Elérhető: ${product.current_stock}, kért: ${item.quantity}`
          );
        }

        if (product.status !== 'available') {
          throw new BadRequestException(
            `A termék jelenleg nem elérhető: ${product.name}`
          );
        }
      }

      const purchases: Purchase[] = [];

      for (const item of cart.items) {
        const purchase = this.purchaseRepository.create({
          user: { user_id: userId },
          product: item.product,
          quantity: item.quantity,
        });

        const savedPurchase = await queryRunner.manager.save(purchase);
        purchases.push(savedPurchase);
      }

      await this.userService.adjustUserBalance(userId, webshopId, -totalAmount);

      for (const item of cart.items) {
        await this.productService.decreaseStock(item.product.product_id, item.quantity);
      }

      await this.cartService.clearCart(userId, webshopId);

      await queryRunner.commitTransaction();

      return {
        purchases,
        totalAmount,
        message: 'Sikeres vásárlás!',
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return await this.purchaseRepository.find({
      where: { user: { user_id: userId } },
      relations: ['product', 'product.webshop'],
      order: { purchase_date: 'DESC' },
    });
  }

  async getUserPurchasesByWebshop(userId: number, webshopId: number): Promise<Purchase[]> {
    return await this.purchaseRepository.find({
      where: {
        user: { user_id: userId },
        product: { webshop: { webshop_id: webshopId } }
      },
      relations: ['product', 'product.webshop'],
      order: { purchase_date: 'DESC' },
    });
  }

  async getWebshopPurchases(webshopId: number): Promise<Purchase[]> {
    return await this.purchaseRepository.find({
      where: {
        product: { webshop: { webshop_id: webshopId } }
      },
      relations: ['user', 'product'],
      order: { purchase_date: 'DESC' },
    });
  }

  async getPurchaseStats(webshopId: number): Promise<{
    totalPurchases: number;
    totalRevenue: number;
    topProducts: Array<{ productName: string; quantity: number }>;
  }> {
    const purchases = await this.getWebshopPurchases(webshopId);

    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.product.price * p.quantity), 0);

    const productStats = new Map<string, number>();
    purchases.forEach(p => {
      const current = productStats.get(p.product.name) || 0;
      productStats.set(p.product.name, current + p.quantity);
    });

    const topProducts = Array.from(productStats.entries())
      .map(([productName, quantity]) => ({ productName, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalPurchases,
      totalRevenue,
      topProducts,
    };
  }
}