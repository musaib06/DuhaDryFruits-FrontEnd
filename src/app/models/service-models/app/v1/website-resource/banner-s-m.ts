import { DuhaDryFruitsServiceModelBase } from "../../base/DuhaDryFruits-service-model-base";

export class BannerSM extends DuhaDryFruitsServiceModelBase<number> {
  title?: string;
  description?: string;
  imagePath!: string;
  imageUrl?: string;
  sequence: number = 0;
  link?: string;
  ctaText?: string;
  bannerType!: 'Slider' | 'ShortAdd' | 'LongAdd' | 'Sales' | 'Voucher';
  isVisible: boolean = true;
  image_base64?: string; // For client-side use only
}
