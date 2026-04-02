import { IsInt, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class GenerateQRDto {
    @IsInt()
    @Min(1)
    webshopId: number;

    @IsInt()
    @Min(1)
    @Max(10000)
    maxActivations: number;

    @IsNumber()
    @Min(0.01)
    codeValue: number;

    @IsDateString()
    expiryDate: string;
}