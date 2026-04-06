import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseFilters,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DemoGuard } from '../auth/guards/demo.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entity/user.entity';

@Controller('purchase')
@UseFilters(new HttpExceptionFilter())
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) { }

  @Post(':userId/:webshopId')
  @UseGuards(JwtAuthGuard, DemoGuard)
  async createPurchase(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('webshopId', ParseIntPipe) webshopId: number,
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('Csak a saját kosaradból vásárolhatsz');
    }

    try {
      const result = await this.purchaseService.createPurchase(userId, webshopId);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw new HttpException(
        error.message || 'Failed to create purchase',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPurchases(@Param('userId', ParseIntPipe) userId: number) {
    try {
      return await this.purchaseService.getUserPurchases(userId);
    } catch (error) {
      throw new HttpException('Failed to fetch purchase history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/:userId/webshop/:webshopId')
  @UseGuards(JwtAuthGuard)
  async getUserPurchasesByWebshop(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('webshopId', ParseIntPipe) webshopId: number,
  ) {
    try {
      return await this.purchaseService.getUserPurchasesByWebshop(userId, webshopId);
    } catch (error) {
      throw new HttpException('Failed to fetch purchase history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('webshop/:webshopId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getWebshopPurchases(@Param('webshopId', ParseIntPipe) webshopId: number) {
    try {
      return await this.purchaseService.getWebshopPurchases(webshopId);
    } catch (error) {
      throw new HttpException('Failed to fetch webshop purchases', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('webshop/:webshopId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getPurchaseStats(@Param('webshopId', ParseIntPipe) webshopId: number) {
    try {
      return await this.purchaseService.getPurchaseStats(webshopId);
    } catch (error) {
      throw new HttpException('Failed to fetch purchase stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}