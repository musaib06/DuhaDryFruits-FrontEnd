import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ABOUT_SEO_DESCRIPTION, ABOUT_SEO_TITLE, HOME_SEO_KEYWORDS } from '../../../../../../constants/seo-copy';

const FAQ_SCRIPT_ID = 'duha-about-faq-jsonld';

@Component({
  selector: 'app-about-us',
  imports: [RouterModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
})
export class AboutUs implements OnInit, OnDestroy {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    this.title.setTitle(ABOUT_SEO_TITLE);
    this.meta.updateTag({ name: 'description', content: ABOUT_SEO_DESCRIPTION });
    this.meta.updateTag({ name: 'keywords', content: HOME_SEO_KEYWORDS });
    this.meta.updateTag({ property: 'og:title', content: ABOUT_SEO_TITLE });
    this.meta.updateTag({ property: 'og:description', content: ABOUT_SEO_DESCRIPTION });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.duhadryfruits.com/about-duha' });
    this.setFaqJsonLd();
  }

  ngOnDestroy(): void {
    this.document.getElementById(FAQ_SCRIPT_ID)?.remove();
  }

  private setFaqJsonLd(): void {
    this.document.getElementById(FAQ_SCRIPT_ID)?.remove();
    const script = this.document.createElement('script');
    script.id = FAQ_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Duha Dryfruits the same as Kashmir Exotics, Royal Kashmir, My Pahadi Dukan, Zamindar Kesar or Kongposh?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Those are separate Kashmir specialty businesses. Duha Dryfruits is our own farm brand from Gundbal, Pampore. We do not run those websites and we do not sell their products. We grow and pack kesar, walnuts, almonds and shilajit at source.',
          },
        },
        {
          '@type': 'Question',
          name: 'Where does Duha Dryfruits grow Kashmir saffron and dry fruits?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Duha Dryfruits is based in Gundbal, Pampore — Kashmir’s saffron land. We pack dry fruits, Pampore kesar and shilajit from our own farms and deliver across India.',
          },
        },
      ],
    });
    this.document.head.appendChild(script);
  }
}
