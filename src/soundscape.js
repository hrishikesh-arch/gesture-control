import './style.css';

const app = document.querySelector('#app');

const sparklePositions = [
  { top: '5%', left: '26%', size: '48px', delay: '0s' },
  { top: '9%', left: '72%', size: '32px', delay: '1.5s' },
  { top: '21%', left: '84%', size: '62px', delay: '0.7s' },
  { top: '62%', left: '58%', size: '68px', delay: '2.1s' },
  { top: '76%', left: '87%', size: '26px', delay: '1.2s' },
  { top: '38%', left: '8%', size: '34px', delay: '2.8s' },
  { top: '71%', left: '17%', size: '40px', delay: '0.4s' },
  { top: '14%', left: '35%', size: '72px', delay: '1.9s' },
  { top: '55%', left: '9%', size: '128px', delay: '0.9s' }
];

const clusterPositions = [
  { top: '4%', right: '11%' },
  { top: '42%', left: '3%' },
  { bottom: '8%', left: '56%' }
];

app.innerHTML = `
  <main class="soundscape">
    <div class="soundscape__backdrop"></div>
    <div class="soundscape__nebula soundscape__nebula--violet"></div>
    <div class="soundscape__nebula soundscape__nebula--aqua"></div>
    <div class="soundscape__nebula soundscape__nebula--ember"></div>
    <div class="soundscape__mist soundscape__mist--left"></div>
    <div class="soundscape__mist soundscape__mist--right"></div>
    <div class="soundscape__smoke soundscape__smoke--center"></div>
    <div class="soundscape__smoke soundscape__smoke--rock"></div>
    <div class="soundscape__grid"></div>

    <header class="topbar">
      <div class="brand">
        <span class="brand__strong">SOUND</span><span class="brand__light">/SCAPE</span>
      </div>
      <button class="menu-button" aria-label="Open menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>

    <section class="hero">
      <p class="hero__eyebrow">EXPLORE CONSTELLATIONS</p>
      <h1 class="hero__title">THE UNIVERSE OF<br />SOUND. DECODED.</h1>
    </section>

    <div class="labels">
      <span class="label label--artists">Artists</span>
      <span class="label label--pop">Pop</span>
      <span class="label label--rock-top">Rock</span>
      <span class="label label--rock-bottom">Rock</span>
      <span class="label label--track">Blinding Lights -<br />The Weeknd</span>
    </div>

    <div class="constellation constellation--top"></div>
    <div class="constellation constellation--right"></div>
    <div class="constellation constellation--bottom"></div>

    <section class="controls" aria-label="Playback controls">
      <div class="palette">
        <button class="palette__dot palette__dot--coral" aria-label="Coral"></button>
        <button class="palette__dot palette__dot--amber" aria-label="Amber"></button>
        <button class="palette__dot palette__dot--green" aria-label="Green"></button>
        <button class="palette__dot palette__dot--blue" aria-label="Blue"></button>
        <button class="palette__dot palette__dot--white" aria-label="White"></button>
      </div>
      <div class="controls__caption">'play cool' band tune</div>
      <div class="toolbar">
        <button class="toolbar__button toolbar__button--grid" aria-label="Grid view">
          <span></span><span></span><span></span><span></span>
        </button>
        <button class="toolbar__button toolbar__button--active" aria-label="Wave mode">∿</button>
        <button class="toolbar__button" aria-label="Text mode">T</button>
      </div>
    </section>

    <div class="corner-glint"></div>
  </main>
`;

const starsMarkup = sparklePositions
  .map(
    ({ top, left, size, delay }) => `
      <svg class="sparkle" style="top:${top}; left:${left}; width:${size}; height:${size}; animation-delay:${delay}" viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,2 59,37 98,50 59,63 50,98 41,63 2,50 41,37" />
        <polygon points="50,12 65,35 88,50 65,65 50,88 35,65 12,50 35,35" />
      </svg>
    `
  )
  .join('');

const clustersMarkup = clusterPositions
  .map((position) => {
    const style = Object.entries(position)
      .map(([key, value]) => `${key}:${value}`)
      .join(';');

    const dots = new Array(7)
      .fill(null)
      .map(
        (_, index) => `
          <span class="star-cluster__dot" style="transform: rotate(${index * 52}deg) translateY(-22px)"></span>
        `
      )
      .join('');

    return `<div class="star-cluster" style="${style}">${dots}</div>`;
  })
  .join('');

app.insertAdjacentHTML('beforeend', starsMarkup + clustersMarkup);
