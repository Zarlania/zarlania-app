import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <p class="eyebrow">Your collection, mastered</p>
      <h1>Command every collection you own.</h1>
      <p class="lead">
        Catalog, index, and track the value of your card collections in one vault — starting with
        Magic: The Gathering, with more worlds to come.
      </p>
      <div class="cta-row">
        <a class="btn-primary" routerLink="/signup">Create your vault</a>
        <a class="btn-ghost" href="#how-it-works">See how it works</a>
      </div>
    </section>

    <section id="features" class="section">
      <p class="eyebrow">Features</p>
      <h2>Everything a collector needs</h2>
      <p class="section-sub">Built for people who take their collections seriously.</p>
      <ul class="cards">
        <li class="card">
          <h3>Index deeply</h3>
          <p>Organize by set, rarity, condition, and printing — down to the detail.</p>
        </li>
        <li class="card">
          <h3>Track value</h3>
          <p>Watch what your hoard is worth as prices shift over time.</p>
        </li>
        <li class="card">
          <h3>One home, many worlds</h3>
          <p>Start with MTG; expand into every collection you keep.</p>
        </li>
      </ul>
    </section>

    <section id="how-it-works" class="section">
      <p class="eyebrow">How it works</p>
      <h2>From pile to vault in three steps</h2>
      <ol class="steps">
        <li><span class="step-n">1</span>Create your free vault</li>
        <li><span class="step-n">2</span>Add your cards &amp; sets</li>
        <li><span class="step-n">3</span>Track, organize &amp; grow</li>
      </ol>
    </section>

    <section class="section">
      <p class="eyebrow">Collections</p>
      <h2>Starting with Magic: The Gathering</h2>
      <p class="section-sub">More collectibles are on the way.</p>
      <ul class="collections">
        <li class="chip chip-active">Magic: The Gathering</li>
        <li class="chip chip-soon">Pokémon TCG · soon</li>
        <li class="chip chip-soon">Coins · soon</li>
        <li class="chip chip-soon">Books · soon</li>
        <li class="chip chip-soon">Movies · soon</li>
      </ul>
    </section>

    <section class="section cta-band">
      <h2>Your vault is waiting.</h2>
      <p class="section-sub">Create an account and start cataloging in minutes.</p>
      <a class="btn-primary" routerLink="/signup">Sign up free</a>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.7rem;
        color: var(--color-accent);
        margin: 0 0 var(--space-2);
      }
      .hero {
        padding: var(--space-8) var(--space-6);
        max-width: 60rem;
      }
      .hero h1 {
        font-size: 2.4rem;
        line-height: 1.15;
        margin: 0 0 var(--space-3);
      }
      .lead {
        font-size: 1.05rem;
        color: var(--color-text-muted);
        max-width: 42ch;
        margin: 0 0 var(--space-6);
      }
      .cta-row {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
      }
      .btn-primary {
        background: var(--color-action);
        color: var(--color-on-action);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 700;
        text-decoration: none;
      }
      .btn-ghost {
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 600;
        text-decoration: none;
      }
      .section {
        padding: var(--space-8) var(--space-6);
        border-top: 1px solid var(--color-border);
      }
      .section h2 {
        font-size: 1.5rem;
        margin: 0 0 var(--space-2);
      }
      .section-sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .cards {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: var(--space-4);
      }
      .card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
      }
      .card h3 {
        margin: 0 0 var(--space-2);
      }
      .card p {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.9rem;
      }
      .steps {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: var(--space-4);
      }
      .steps li {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .step-n {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid var(--color-brand);
        color: var(--color-brand);
        font-weight: 700;
      }
      .collections {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .chip {
        padding: var(--space-2) var(--space-3);
        border-radius: 999px;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        font-size: 0.85rem;
      }
      .chip-active {
        border-color: var(--color-action);
        color: var(--color-action-hover);
      }
      .chip-soon {
        opacity: 0.6;
        font-style: italic;
      }
      .cta-band {
        text-align: center;
      }
      .cta-band .btn-primary {
        display: inline-block;
        margin-top: var(--space-4);
      }
    `,
  ],
})
export class LandingComponent {}
