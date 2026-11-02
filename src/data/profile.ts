// Everything about you that isn't a list. Leave a handle as '' to hide that link.
export const profile = {
  name: 'Abhishek Jha',
  headline: 'Software engineer: backend systems and LLM-powered products',
  intro:
    'First engineer at Clicknscape, where I built the backend of an AI travel planner: an LLM agent for the conversation and a deterministic routing engine for every fact. I like Postgres, careful failure handling, and systems I can explain end to end. I also build hardware now and then.',
  location: 'Bhubaneswar, India',
  email: '1xabhishek.jha@gmail.com',
  // Put a phone-free PDF at public/resume.pdf and the Resume button appears.
  resumePath: '/resume.pdf',
  profiles: {
    github: 'IAbhishekJhaI',
    linkedin: '1xabhishek-jha',
    leetcode: '', // TODO: your LeetCode username
    codeforces: '', // TODO: your Codeforces handle
  },
  skills: [
    { group: 'Languages', items: ['Python', 'TypeScript', 'SQL', 'Java', 'Verilog'] },
    {
      group: 'AI / LLM',
      items: ['Gemini API', 'Tool calling', 'Structured output', 'Prompt design', 'LLM cost optimization', 'OpenCV', 'OR-Tools'],
    },
    {
      group: 'Backend & data',
      items: ['FastAPI', 'SQLAlchemy', 'Alembic', 'Node.js', 'Next.js', 'PostgreSQL (PostGIS, RLS)', 'Redis', 'Supabase', 'Drizzle'],
    },
    { group: 'Tools', items: ['Git', 'Docker', 'Linux', 'Render', 'Vercel', 'Claude Code', 'Vivado (FPGA)'] },
  ],
};

export const profileLinks = [
  { label: 'GitHub', handle: profile.profiles.github, url: `https://github.com/${profile.profiles.github}` },
  { label: 'LinkedIn', handle: profile.profiles.linkedin, url: `https://www.linkedin.com/in/${profile.profiles.linkedin}` },
  { label: 'LeetCode', handle: profile.profiles.leetcode, url: `https://leetcode.com/u/${profile.profiles.leetcode}/` },
  { label: 'Codeforces', handle: profile.profiles.codeforces, url: `https://codeforces.com/profile/${profile.profiles.codeforces}` },
].filter((l) => l.handle);
