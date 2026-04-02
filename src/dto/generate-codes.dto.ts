import { IsInt, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class GenerateCodesDto {
    @IsInt()
    @Min(1)
    webshopId: number;

    @IsInt()
    @Min(1)
    @Max(1000)
    codeCount: number;

    @IsNumber()
    @Min(0.01)
    codeValue: number;

    @IsDateString()
    expiryDate: string;
}