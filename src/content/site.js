import { featured } from './projects/index.js';

// Everything the page says, outside of the project pages (those live in ./projects).

export const profile = {
  firstName: 'Akshar',
  lastName: 'Vandara',
  role: 'Software / Research Engineer',
  tagline: 'Gameplay systems, procedural content generation and constraint solving.',
  highlight: '3 peer-reviewed publications in PCG and constraint optimization',
  stats: [
    { value: '03', label: 'peer-reviewed papers' },
    { value: '04', label: 'studios & labs' },
    { value: '100–500×', label: 'faster level generation' },
  ],
  location: 'San Francisco Bay Area, CA',
  now: 'Game Programming Intern @ E-Line Media',
  email: 'axr230102@gmail.com',
  resume: 'https://akshar-23.github.io/resume/resume.pdf',
  links: [
    { label: 'GitHub', url: 'https://github.com/akshar-23' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/akshar-vandara' },
    // TODO: add the Google Scholar profile url
    { label: 'Scholar', url: null },
  ],
};

// TODO: replace with the real about text
export const about = {
  paragraphs: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Cras mattis consectetur purus sit amet fermentum. Vestibulum id ligula porta felis euismod semper, nulla vitae elit libero, a pharetra augue.',
    'Donec ullamcorper nulla non metus auctor fringilla. Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo. Curabitur blandit tempus porttitor, cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
    'Aenean lacinia bibendum nulla sed consectetur. Etiam porta sem malesuada magna mollis euismod. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Sed posuere consectetur est at lobortis.',
  ],
  facts: [
    { label: 'based in', value: 'San Francisco Bay Area' },
    { label: 'focus', value: 'Gameplay systems · PCG · Game AI' },
    { label: 'research', value: '3 first-author papers' },
  ],
  education: [
    {
      school: 'Northeastern University',
      degree: 'M.S., Game Science and Design',
      when: 'May 2026',
      where: 'Boston, MA',
      detail: 'GPA 3.87 · Game Data Science, Game AI',
    },
    {
      school: 'Gujarat Technological University',
      degree: 'B.E., Computer Engineering',
      when: 'May 2023',
      where: 'Ahmedabad, India',
      detail: 'GPA 3.6 · Algorithms, AI, ML',
    },
  ],
};

export const experience = [
  {
    role: 'Game Programming Intern',
    company: 'E-Line Media',
    where: 'Phoenix, AZ',
    when: 'Jul 2026 — Present',
    points: [
      'Built a C# content pipeline (Google Sheets API, AWS S3, Vimeo) for an investor-pitch prototype, so designers ship content without rebuilds.',
      'Designing a data-driven state machine for the iOS game flow; designers reorder screens without code changes.',
      'Developed an event-driven turn timeline, a stack-based screen manager and a save/load system for player progression.',
      'Implemented a pooled audio manager with priority-based voice stealing, and scaled the iOS UI for iPhone and iPad.',
    ],
    tags: ['C#', 'Unity', 'iOS', 'AWS S3'],
  },
  {
    role: 'Research Assistant',
    company: 'Game Design Lab, Northeastern University',
    where: 'Boston, MA',
    when: 'Feb 2025 — Present',
    points: [
      'Extended the Sturgeon level generator (Python, PySAT) to spacetime generation, running 100–500× faster than Spacetime WFC, with an interactive editor for real-time level and path editing.',
      'Added 4D spacetime blending of learned game mechanics, plus 3D voxel visualization through VTK / ParaView.',
      'Engineered a Python constraint solver on Z3 SMT for generating continuous spacetime gameplay.',
    ],
    tags: ['Python', 'PySAT', 'Z3', 'ParaView'],
  },
  {
    role: 'Gameplay Systems & UI Programmer',
    company: 'Otisco Studios',
    where: 'Orlando, FL',
    when: 'May 2025 — Aug 2025',
    points: [
      'Programmed 8+ core gameplay systems in Unreal / C++, including save/load and UI, across two titles.',
      'Created 5+ NPC and enemy AI archetypes with Behavior Trees and custom EQS.',
      'Doubled the average framerate by profiling and refactoring C++ gameplay code, and resolved 30+ pre-launch bugs.',
    ],
    tags: ['Unreal Engine 5', 'C++', 'Behavior Trees'],
  },
  {
    role: 'Unity Developer',
    company: 'Arcadon Games',
    where: 'Bangalore, India',
    when: 'Mar 2023 — Jul 2024',
    points: [
      'Developed core gameplay mechanics in Unity / C# using state machines, improving input responsiveness by 30%.',
      'Integrated Firebase to store and sync 1,000+ user profiles and inventory data with sub-100 ms responses.',
      'Wrote a match-simulation system that processes 30 matches a minute and cut load times by 40%.',
    ],
    tags: ['Unity', 'C#', 'Firebase'],
  },
];

// TODO: the titles below describe each paper's topic; swap in the published titles and links
export const research = {
  intro: 'At the Game Design Lab I work on generating levels and gameplay that move through both space and time, by modelling them as constraint problems.',
  papers: [
    {
      title: 'Spacetime level generation with Sturgeon',
      venue: 'AAAI AIIDE 2025',
      author: 'First author',
      summary: 'Extends the Sturgeon constraint-based generator to spacetime levels, running 100–500× faster than Spacetime WFC, with an interactive editor for real-time level and path editing.',
      url: null,
    },
    {
      title: '4D spacetime blending of learned mechanics',
      venue: 'FDG 2026 · PCG Workshop',
      author: 'First author',
      summary: 'Blends learned game mechanics across 4D spacetime, with 3D voxel views of the results in VTK and ParaView.',
      url: null,
    },
    {
      title: 'Continuous spacetime gameplay with SMT',
      venue: 'FDG 2026 · PCG Workshop',
      author: 'First author',
      summary: 'A Python constraint solver built on Z3 SMT that generates continuous spacetime gameplay.',
      url: null,
    },
  ],
};

export const skills = [
  { group: 'languages', items: ['C++', 'C# (.NET)', 'Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'C'] },
  { group: 'engines-tools', items: ['Unity (2D/3D)', 'Unreal Engine 5', 'Git', 'Perforce', 'Docker', 'Xcode (iOS)', 'ParaView / VTK'] },
  { group: 'backend-cloud', items: ['REST APIs', 'Google Sheets API', 'AWS S3', 'GCP', 'Firebase', 'Node.js', 'Flask', 'Django', 'React'] },
  { group: 'ml-ai', items: ['PyTorch', 'TensorFlow', 'NumPy', 'Pandas', 'CUDA', 'Z3 SMT', 'PySAT', 'SAT / CSP modeling', 'OpenCV'] },
  { group: 'foundations', items: ['Data Structures', 'Algorithms', 'Object-Oriented Design', 'State Machines', 'Multithreading'] },
];

// The page sections, in order. Each one is a waypoint on the ship's route through the
// background, and takes the color of the object the ship passes there. steps: how many
// screens the section pages through before moving on to the next waypoint.
export const sections = [
  { id: 'top', label: 'home', accent: 'var(--rust)' },
  { id: 'about', label: 'about', accent: 'var(--teal)' },
  { id: 'experience', label: 'experience', accent: 'var(--ember)', steps: experience.length },
  { id: 'research', label: 'research', accent: 'var(--lilac)' },
  { id: 'projects', label: 'projects', accent: 'var(--rose)', steps: featured.length },
  { id: 'skills', label: 'skills', accent: 'var(--ice)' },
  { id: 'contact', label: 'contact', accent: 'var(--gold)' },
];

// Status lines in the HUD ticker.
export const transmissions = [
  `now › ${profile.now}`,
  `research › ${profile.highlight}`,
  `based › ${profile.location}`,
  'focus › gameplay systems · procedural content generation · game ai',
];
