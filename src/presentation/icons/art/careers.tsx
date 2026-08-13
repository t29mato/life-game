import { type ReactElement } from 'react'

import {
  Apron,
  Arm,
  Backdrop,
  Bust,
  Cap,
  Clipboard,
  DiveMask,
  FaceMask,
  Glasses,
  HardHat,
  Headset,
  Helmet,
  ScrubCap,
  Toque,
  look,
} from '../parts'

/**
 * The twelve careers: a portrait bust for each, on `Backdrop`.
 *
 * Every character is built from the same `Bust` — same proportions, same
 * shading rules — dressed differently: a toque and piping bag read as a
 * pastry chef, a hard hat and a rolled blueprint read as a foreman. The trade
 * is meant to be readable from the silhouette alone, before any colour.
 */

// ---------------------------------------------------------------------------
// Scene palette. Warm, saturated bands behind each bust, distinct enough that
// twelve tiles in a row are easy to tell apart at a glance.
// ---------------------------------------------------------------------------

const SCENE = {
  bakery: { tone: '#ffe3c2', rim: '#e8b878', wash: '#fff1de', floor: '#f3cd94' },
  street: { tone: '#ffd9c9', rim: '#e89a72', wash: '#ffe9dc', floor: '#f2b78e' },
  salon: { tone: '#ffd9e6', rim: '#e888ab', wash: '#ffeaf1', floor: '#f4b0c8' },
  road: { tone: '#dcecff', rim: '#7ea8dc', wash: '#eef6ff', floor: '#b9d3f2' },
  site: { tone: '#ffe6ad', rim: '#d99a1f', wash: '#fff2cf', floor: '#f0c25e' },
  studio: { tone: '#e6dcff', rim: '#9678d9', wash: '#f2ecff', floor: '#c6b2ef' },
  sea: { tone: '#bfeaf0', rim: '#3fa6ac', wash: '#e0f7f8', floor: '#7ecdd1' },
  screen: { tone: '#d6e8ff', rim: '#5f8fd6', wash: '#eaf3ff', floor: '#a9c6ef' },
  office: { tone: '#e2e8f5', rim: '#8892b5', wash: '#f2f4fa', floor: '#c3cadf' },
  code: { tone: '#dbe9e6', rim: '#4c9c8e', wash: '#eef7f5', floor: '#a6d3c9' },
  theatre: { tone: '#ffe0e0', rim: '#d9645f', wash: '#fff0ee', floor: '#f0a29d' },
  court: { tone: '#e8e3ff', rim: '#7c68c9', wash: '#f4f0ff', floor: '#c2b3ef' },
} as const

/** A rolling pin, resting across the lower hands. */
function RollingPin(): ReactElement {
  return (
    <g>
      <rect x="18" y="49" width="28" height="5.6" rx="2.8" fill="#e3c493" />
      <circle cx="16.4" cy="51.8" r="3.4" fill="#c9a06a" />
      <circle cx="47.6" cy="51.8" r="3.4" fill="#c9a06a" />
    </g>
  )
}

/** A piping bag, held in one hand with a swirl of icing. */
function PipingBag(): ReactElement {
  return (
    <g>
      <path d="M40 44 50 40 55 45 46 52Z" fill="#fdfaf4" />
      <path d="M50 40 55 45 51 47 47 42Z" fill="#dcd5c8" />
      <circle cx="57" cy="46" r="2.6" fill="#f6b8cf" />
      <circle cx="60" cy="49" r="1.7" fill="#f6b8cf" />
    </g>
  )
}

/** A steaming taco, held up beside the frame. */
function Taco(): ReactElement {
  return (
    <g>
      <path d="M44 44C44 50 50 54 57 54 57 47 51 44 44 44Z" fill="#e6c48a" />
      <path d="M46 45.4C48 49 52 51.4 55.4 52 54 47.4 50.4 45.4 46 45.4Z" fill="#5cb45c" />
      <circle cx="51" cy="49" r="1.4" fill="#e0574a" />
      <circle cx="54" cy="47" r="1.2" fill="#e0574a" />
      <path d="M50 36c-1.4-2-1.4-4 0-5.6M54 36c-1.2-2.6-1-4.6.4-6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </g>
  )
}

/** A soapy dog, mid-groom, tucked beside the shoulder. */
function GroomedDog(): ReactElement {
  return (
    <g>
      <ellipse cx="49" cy="52" rx="11" ry="8.4" fill="#f4efe4" />
      <circle cx="40" cy="46" r="6" fill="#f4efe4" />
      <path d="M35.4 42.2C34 39.6 35.4 37.4 37.6 37.8 38.4 40 38.6 41.8 38 43.8Z" fill="#f4efe4" />
      <path d="M43 42.4C44.6 39.8 43.4 37.4 41 37.8 40 40 39.8 41.8 40.4 44Z" fill="#f4efe4" />
      <circle cx="38.4" cy="46.4" r="1.1" fill="#2b2118" />
      <circle cx="42" cy="46.8" r="1.1" fill="#2b2118" />
      <g fill="#fff" opacity="0.9">
        <circle cx="52" cy="47" r="2.2" />
        <circle cx="56.4" cy="50" r="1.8" />
        <circle cx="50.6" cy="53.4" r="2" />
      </g>
    </g>
  )
}

/** A courier's parcel, held against the chest. */
function Parcel(): ReactElement {
  return (
    <g>
      <rect x="38" y="42" width="17" height="15" rx="1.6" fill="#d8a85e" />
      <rect x="38" y="42" width="17" height="15" rx="1.6" fill="none" stroke="#a97a34" strokeWidth="1.4" />
      <path d="M46.5 42V57M38 49.5H55" stroke="#a97a34" strokeWidth="1.6" />
    </g>
  )
}

/** A rolled blueprint tucked under the arm. */
function Blueprint(): ReactElement {
  return (
    <g>
      <rect x="40" y="40" width="8.4" height="20" rx="4.2" fill="#5f8fd6" transform="rotate(18 44.2 50)" />
      <rect x="40" y="40" width="8.4" height="20" rx="4.2" fill="none" stroke="#3a6ab0" strokeWidth="1.4" transform="rotate(18 44.2 50)" />
    </g>
  )
}

/** A pair of styling scissors, held open beside the face. */
function Scissors(): ReactElement {
  return (
    <g transform="translate(48 44) rotate(24)" fill="none" stroke="#b9c3cf" strokeWidth="1.8">
      <path d="M0 0 11 -5" />
      <path d="M0 0 11 5" />
      <circle cx="-1.6" cy="-1.8" r="2.4" fill="#b9c3cf" stroke="none" />
      <circle cx="-1.6" cy="1.8" r="2.4" fill="#7b8698" stroke="none" />
    </g>
  )
}

/** A specimen jar with a small fish, held up in a gloved hand. */
function SpecimenJar(): ReactElement {
  return (
    <g>
      <path d="M42 38H54V56C54 58 52.6 59.4 50.6 59.4H45.4C43.4 59.4 42 58 42 56Z" fill="#bfeaf0" opacity="0.9" />
      <rect x="41.4" y="35.4" width="13.2" height="4" rx="1.6" fill="#7ecdd1" />
      <path d="M46 50c1.6-1.4 4-1.4 5.4 0-.6 1.6-1.8 2.2-2.7 2.2s-2.1-.6-2.7-2.2Z" fill="#3fa6ac" />
    </g>
  )
}

/** A game controller, held low in both hands. */
function Controller(): ReactElement {
  return (
    <g>
      <path
        d="M22 50C22 46 25 44 29 44H37C41 44 44 46 44 50S41 58 37.4 58C35 58 34.4 55.4 33 55.4H30.4C29 55.4 28.4 58 26 58 22.4 58 22 54 22 50Z"
        fill="#3b3350"
      />
      <circle cx="27" cy="49.4" r="1.7" fill="#59e3d0" />
      <circle cx="27" cy="53.4" r="1.7" fill="#59e3d0" />
      <circle cx="39" cy="49.4" r="1.7" fill="#e0479a" />
      <circle cx="39" cy="53.4" r="1.7" fill="#e0479a" />
    </g>
  )
}

/** A stethoscope, worn around the neck with the chestpiece hanging low. */
function Stethoscope(): ReactElement {
  return (
    <g fill="none" stroke="#d6e8ff" strokeWidth="2.4" strokeLinecap="round">
      <path d="M22 43c0 8 3 13 10 13s10-5 10-13" />
      <circle cx="42" cy="58" r="3.2" fill="#d6e8ff" stroke="none" />
    </g>
  )
}

/** A leather briefcase, held up beside the shoulder. */
function Briefcase(): ReactElement {
  return (
    <g>
      <rect x="40" y="45" width="18" height="13" rx="2" fill="#7c68c9" />
      <rect x="40" y="45" width="18" height="13" rx="2" fill="none" stroke="#5a4a9e" strokeWidth="1.4" />
      <path d="M46 45v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#5a4a9e" strokeWidth="1.8" />
      <rect x="47.8" y="49.6" width="2.4" height="3" rx="0.8" fill="#5a4a9e" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export function pastryChef(): ReactElement {
  const scene = SCENE.bakery
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(1, '#3d2b1f', 'wave', { mouth: 'grin' })}
        wear="#f3809f"
        wearDark="#c95a7d"
        collar="chef"
        build="regular"
        tilt={-4}
        headwear={<Toque />}
      >
        <Apron cloth="#fdfaf4" clothShade="#e4ddd0" strap="#e4ddd0" />
      </Bust>
      <RollingPin />
      <Arm from={{ x: 42, y: 47 }} to={{ x: 47, y: 50 }} bend={2} sleeve="#f3809f" skin={look(1, '', 'none').skin} width={6} handR={3.4} />
      <PipingBag />
    </g>
  )
}

export function foodTruckOwner(): ReactElement {
  const scene = SCENE.street
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(3, '#241d2b', 'buzz', { facialHair: 'stubble', mouth: 'grin' })}
        wear="#f0913c"
        wearDark="#c96a24"
        collar="crew"
        build="broad"
        tilt={3}
        headwear={<Cap cloth="#e2523f" clothShade="#b23425" />}
      />
      <Taco />
    </g>
  )
}

export function petGroomer(): ReactElement {
  const scene = SCENE.salon
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(0, '#e0b45c', 'ponytail', { mouth: 'smile' })}
        wear="#3fc0b0"
        wearDark="#2a9689"
        collar="v"
        build="slim"
        tilt={-3}
      >
        <Apron cloth="#eaf7f5" clothShade="#c9e6e1" strap="#c9e6e1" />
      </Bust>
      <GroomedDog />
    </g>
  )
}

export function deliveryCourier(): ReactElement {
  const scene = SCENE.road
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(4, '#241d2b', 'short', { mouth: 'grin' })}
        wear="#5aa9e6"
        wearDark="#3a7fbf"
        collar="crew"
        build="regular"
        tilt={4}
        headwear={<Helmet />}
      />
      <Parcel />
    </g>
  )
}

export function constructionForeman(): ReactElement {
  const scene = SCENE.site
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(2, '#3d2b1f', 'crop', { facialHair: 'moustache', mouth: 'flat' })}
        wear="#f3b13c"
        wearDark="#c9861a"
        collar="crew"
        build="broad"
        tilt={-2}
        headwear={<HardHat />}
      />
      <Blueprint />
    </g>
  )
}

export function salonOwner(): ReactElement {
  const scene = SCENE.salon
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(1, '#e0479a', 'curls', { mouth: 'grin' })}
        wear="#8f7fd6"
        wearDark="#6f5fc0"
        collar="v"
        build="slim"
        tilt={5}
      />
      <Scissors />
    </g>
  )
}

export function marineBiologist(): ReactElement {
  const scene = SCENE.sea
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(2, '#241d2b', 'braids', { mouth: 'smile' })}
        wear="#3fc0b0"
        wearDark="#2a9689"
        collar="crew"
        build="regular"
        tilt={-3}
        headwear={<DiveMask />}
      />
      <SpecimenJar />
    </g>
  )
}

export function gameDesigner(): ReactElement {
  const scene = SCENE.studio
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(0, '#37c7bb', 'crop', { mouth: 'grin' })}
        wear="#e0479a"
        wearDark="#c95a7d"
        collar="crew"
        build="slim"
        tilt={4}
        headwear={<Headset />}
      />
      <Controller />
    </g>
  )
}

export function architect(): ReactElement {
  const scene = SCENE.office
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(3, '#241d2b', 'bun', { mouth: 'smile', brow: '#241d2b' })}
        wear="#5c6784"
        wearDark="#3f4864"
        collar="lapel"
        build="regular"
        tilt={-4}
        headwear={<Glasses />}
      />
      <Blueprint />
    </g>
  )
}

export function softwareEngineer(): ReactElement {
  const scene = SCENE.code
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(4, '#6b4227', 'short', { mouth: 'flat' })}
        wear="#5bc47f"
        wearDark="#3f9e60"
        collar="crew"
        build="slim"
        tilt={3}
        headwear={<Glasses />}
      />
      <Controller />
    </g>
  )
}

export function surgeon(): ReactElement {
  const scene = SCENE.theatre
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(5, '#8a8fa3', 'none', { mouth: 'flat' })}
        wear="#4fbdb2"
        wearDark="#2c8f87"
        collar="none"
        build="regular"
        tilt={0}
        headwear={<ScrubCap />}
      >
        <FaceMask />
      </Bust>
      <Stethoscope />
    </g>
  )
}

export function corporateLawyer(): ReactElement {
  const scene = SCENE.court
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={look(1, '#241d2b', 'wave', { mouth: 'flat', brow: '#241d2b' })}
        wear="#2f3852"
        wearDark="#20263b"
        collar="lapel"
        collarShirt="#ffffff"
        collarShirtShade="#dfe3ee"
        build="broad"
        tilt={-2}
      />
      <Briefcase />
      <Clipboard x={22} y={54} rotate={-8} />
    </g>
  )
}
