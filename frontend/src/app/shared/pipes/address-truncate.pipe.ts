import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'addressTruncate',
  standalone: true
})
export class AddressTruncatePipe implements PipeTransform {
  transform(value: string, startChars: number = 6, endChars: number = 4): string {
    if (!value) return '';
    if (value.length <= startChars + endChars) return value;
    return `${value.substring(0, startChars)}...${value.substring(value.length - endChars)}`;
  }
}
