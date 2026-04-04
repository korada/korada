// 📝 Resume data — update this file with your actual content.
// LinkedIn was not publicly accessible, so fill in the TODOs below.
// Everything marked with "TODO:" is a placeholder for you to update.

export const resumeData = {
  name: 'Venkata Aditya Korada',

  // Typewriter rotates through these on the hero screen
  titles: [
    'Full Stack Developer',
    'Software Engineer',
    'React Enthusiast',
    'Problem Solver',
  ],

  about:
    'Software Engineer at Ally Financial with a passion for building scalable, ' +
    'user-friendly web applications. Based in Charlotte, NC, I bring experience ' +
    'across the full stack — from crafting React and Angular front-ends to building ' +
    'Java and .NET backends, containerising services with Docker, and streaming ' +
    'observability data into Elasticsearch.',

  contact: {
    email: 'venkata@korada.in',
    github: 'https://github.com/korada',
    linkedin: 'https://linkedin.com/in/korvenadi',
    location: 'Charlotte, NC',
  },

  skills: {
    Frontend: [
      'React',
      'Angular',
      'JavaScript (ES6+)',
      'TypeScript',
      'Bootstrap',
      'HTML5 / CSS3',
      'Knockout.js',
    ],
    Backend: ['Java', 'C# / .NET Core', 'Node.js'],
    'Tools & DevOps': ['Docker', 'Elasticsearch', 'Webpack', 'Git / GitHub'],
    Databases: ['SQL', 'Elasticsearch / Kibana'],
  },

  experience: [
    {
      company: 'Ally Financial Inc',
      role: 'Software Engineer', // TODO: update with your exact title
      dates: 'Present · Charlotte, NC',
      bullets: [
        // TODO: paste your experience bullets from LinkedIn here, e.g.:
        'TODO: Add your first achievement / responsibility here.',
        'TODO: Add your second achievement / responsibility here.',
        'TODO: Add your third achievement / responsibility here.',
      ],
    },
    // TODO: add previous roles following the same shape, e.g.:
    // {
    //   company: 'Previous Company',
    //   role: 'Software Developer',
    //   dates: 'Jan 2018 – Dec 2020 · City, State',
    //   bullets: ['...'],
    // },
  ],

  education: [
    {
      school: 'TODO: Your University', // e.g. 'University of Texas at Austin'
      degree: 'TODO: Your Degree',     // e.g. 'B.S. Computer Science'
      year: 'TODO: Graduation Year',   // e.g. '2016'
    },
  ],

  projects: [
    {
      name: 'knockout-pager.js',
      emoji: '📄',
      description:
        'An open-source pagination plugin for Knockout.js with a clean, configurable API.',
      tech: ['JavaScript', 'Knockout.js'],
      url: 'https://github.com/korada/knockout-pager.js',
    },
    {
      name: 'slf4j-elasticsearch',
      emoji: '📊',
      description:
        'Stream SLF4J application logs directly to Elasticsearch for real-time observability.',
      tech: ['Java', 'Elasticsearch', 'SLF4J'],
      url: 'https://github.com/korada/slf4j-elasticsearch',
    },
    {
      name: 'NETCOREDocker',
      emoji: '🐳',
      description:
        'A containerised .NET Core web application demonstrating Docker best practices.',
      tech: ['C#', '.NET Core', 'Docker'],
      url: 'https://github.com/korada/NETCOREDocker',
    },
    {
      name: 'TeslaChargingCalc',
      emoji: '⚡',
      description:
        'Calculate total charging costs across Tesla Supercharger sessions.',
      tech: ['JavaScript'],
      url: null, // private repo — set to null to hide the link
    },
  ],
};
