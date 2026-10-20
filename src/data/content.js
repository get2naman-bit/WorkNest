import {
  ShieldCheck, Compass, Users, User, Search, Briefcase,
  ClipboardList, MessageSquare, Star,
  LayoutDashboard, FileText, Bookmark, CreditCard, Settings, Wrench,
} from 'lucide-react';

export const navLinks = [
  { label: 'Problem', href: '#problem' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Work identity', href: '#identity' },
];

export const problems = [
  { icon: ShieldCheck, title: "Workers can't prove what they've done", text: 'No record of past jobs, no ratings, no way to show reliability to a new employer.' },
  { icon: Compass, title: 'Opportunities are hard to find', text: 'Jobs travel through personal networks, so good work goes to whoever heard first.' },
  { icon: Users, title: 'Employers hire blind', text: 'Screening is slow, references are informal, and the wrong hire costs real money.' },
];

export const solutionPoints = [
  { title: 'Workers', text: 'Profile, skills, availability' },
  { title: 'Employers', text: 'Jobs, applicants, feedback' },
  { title: 'Together', text: 'Messaging, ratings, history' },
];

export const features = [
  { icon: User, title: 'Worker profiles', text: 'Skills, trades, availability and experience in one structured profile employers can trust.' },
  { icon: Search, title: 'Job discovery', text: 'Find nearby work matched to skills, pay range and availability instead of scrolling noise.' },
  { icon: Briefcase, title: 'Job posting', text: 'Employers post a role in under a minute with pay, location, duration and requirements.' },
  { icon: ClipboardList, title: 'Applications', text: 'Track every applicant through applied, shortlisted, interviewing and hired.' },
  { icon: MessageSquare, title: 'Messaging', text: 'Talk directly, agree on details and confirm timings without swapping phone numbers first.' },
  { icon: Star, title: 'Ratings & work history', text: 'Every completed job adds a rating and a record that stays with the worker forever.' },
];

export const steps = [
  { n: '01', title: 'Create a profile', text: 'Workers list skills and experience. Employers set up their business.' },
  { n: '02', title: 'Find or post a job', text: 'Browse matched jobs nearby, or post a role and receive applicants.' },
  { n: '03', title: 'Connect and work', text: 'Message, agree on terms, and get the job done.' },
  { n: '04', title: 'Build work history', text: "Completed jobs and ratings are added to the worker's identity." },
];

export const workerBenefits = [
  'Show your skills and experience in one profile',
  'Discover jobs that match what you actually do',
  'Apply and message employers directly',
  'Collect ratings that carry to your next job',
];

export const employerBenefits = [
  'Post a job and reach nearby skilled workers',
  'Review profiles with real completed work',
  'Manage applications in one place',
  'Message candidates and leave feedback',
];

export const identityChips = [
  { title: 'Verified', text: 'Skills' },
  { title: 'Recorded', text: 'Jobs' },
  { title: 'Portable', text: 'Ratings' },
];

/* ---------- Dashboard mockup ---------- */
export const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: FileText, label: 'Applications' },
  { icon: MessageSquare, label: 'Messages', badge: 3 },
  { icon: Bookmark, label: 'Saved Workers' },
  { icon: CreditCard, label: 'Payments' },
  { icon: Star, label: 'Reviews' },
  { icon: Settings, label: 'Settings' },
];

export const profile = {
  name: 'Alex Morgan',
  role: 'Plumber',
  location: 'Austin, TX 78701',
  rating: 4.8,
  reviews: 128,
  tags: ['Plumbing', 'Pipe Repair', 'Drain Cleaning', 'Water Heater', 'Bathroom Installation', '+3'],
  stats: [
    { label: 'Jobs Completed', value: '156', icon: 'check' },
    { label: 'Member Since', value: 'Jan 2022', icon: 'calendar' },
    { label: 'Avg Response Time', value: '1 hr', icon: 'clock' },
  ],
};

export const completedJobs = [
  { title: 'Kitchen Sink Installation', price: '$350', rating: '5.0', tone: '#dfe6ee' },
  { title: 'Leaky Pipe Repair', price: '$180', rating: '4.5', tone: '#d5dde6' },
  { title: 'Water Heater Replacement', price: '$950', rating: '5.0', tone: '#e3e0da' },
  { title: 'Shower Installation', price: '$650', rating: '4.8', tone: '#dbe3e8' },
];

/* ---------- Worker dashboard mockup: overview ---------- */
export const profileOverview = [
  { label: 'Acceptance rate', value: '94%' },
  { label: 'On-time completion', value: '100%' },
  { label: 'Repeat clients', value: '38' },
  { label: 'Avg project value', value: '$610' },
];

export const applicants = [
  { name: 'Alex Morgan', role: 'Plumber', status: 'Shortlisted' },
  { name: 'Priya Nair', role: 'Electrician', status: 'Applied' },
  { name: 'Marco Diaz', role: 'Carpenter', status: 'Interviewing' },
  { name: 'Sam Okoye', role: 'Painter', status: 'Hired' },
];

export const profileReviews = [
  {
    author: 'Brightwater Properties',
    rating: '5.0',
    date: 'Mar 2024',
    comment: 'Turned up on schedule and the commercial water heater replacement passed inspection first time.',
  },
  {
    author: 'Dana Whitfield',
    rating: '4.8',
    date: 'Feb 2024',
    comment: 'Clean work on a full bathroom refit and clearly explained every part of the quote.',
  },
  {
    author: 'Hilltop Cafe',
    rating: '5.0',
    date: 'Jan 2024',
    comment: 'Fixed a stubborn drain issue that two other plumbers had missed. Highly recommended.',
  },
];

export const profileAbout = {
  bio: 'Licensed plumber working across Austin and Central Texas with a focus on water heaters, drain diagnostics and commercial maintenance contracts.',
  details: [
    ['Trade license', 'Texas Master Plumber'],
    ['Response time', 'Within 1 hour'],
    ['Availability', 'Mon – Sat, emergency callouts'],
    ['Languages', 'English, Spanish'],
  ],
};

export { Wrench };
