// ============================================================
// Supabase row <-> application (camelCase) mappers
// ------------------------------------------------------------
// The UI uses camelCase objects. Supabase returns snake_case
// rows. Every value that crosses the network boundary goes
// through one of these helpers so the two shapes can never
// drift apart.
// ============================================================

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return formatDate(value);
}

export function formatDate(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatMonthYear(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatClockTime(value) {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const asNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// ------------------------------------------------------------
// Profiles
// ------------------------------------------------------------
export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    location: row.location || '',
    companyName: row.company_name || '',
    title: row.title || '',
    bio: row.bio || '',
    hourlyRate: row.hourly_rate || '$45/hr',
    availability: row.availability || 'Available Now',
    rating: row.rating == null ? 5 : asNumber(row.rating, 5),
    reviewsCount: asNumber(row.reviews_count),
    jobsCompleted: asNumber(row.jobs_completed),
    jobsPosted: asNumber(row.jobs_posted),
    workersHired: asNumber(row.workers_hired),
    responseTime: row.response_time || '< 1 hr',
    verified: row.verified !== false,
    skills: Array.isArray(row.skills) ? row.skills : [],
    badges: Array.isArray(row.badges) ? row.badges : [],
    profileCompletion: asNumber(row.profile_completion, 80),
    memberSince: formatMonthYear(row.created_at),
  };
}

const PROFILE_COLUMNS = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  location: 'location',
  companyName: 'company_name',
  title: 'title',
  bio: 'bio',
  hourlyRate: 'hourly_rate',
  availability: 'availability',
  skills: 'skills',
  badges: 'badges',
  profileCompletion: 'profile_completion',
};

export function toProfileRow(updates = {}) {
  const row = {};
  Object.entries(PROFILE_COLUMNS).forEach(([key, column]) => {
    if (updates[key] !== undefined) row[column] = updates[key];
  });
  return row;
}

// ------------------------------------------------------------
// Jobs
// ------------------------------------------------------------
export function mapJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    employerId: row.employer_id,
    companyName: row.company_name || '',
    title: row.title || '',
    category: row.category || 'General Labor',
    location: row.location || '',
    payType: row.pay_type || 'Fixed',
    payRate: row.pay_rate || '',
    duration: row.duration || '',
    postedDate: formatRelativeTime(row.created_at),
    status: row.status || 'active',
    urgent: Boolean(row.urgent),
    description: row.description || '',
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    applicantsCount: asNumber(row.applicants_count),
    createdAt: row.created_at,
  };
}

const JOB_COLUMNS = {
  employerId: 'employer_id',
  companyName: 'company_name',
  title: 'title',
  category: 'category',
  location: 'location',
  payType: 'pay_type',
  payRate: 'pay_rate',
  duration: 'duration',
  status: 'status',
  urgent: 'urgent',
  description: 'description',
  requirements: 'requirements',
  skills: 'skills',
  applicantsCount: 'applicants_count',
};

export function toJobRow(job = {}) {
  const row = {};
  Object.entries(JOB_COLUMNS).forEach(([key, column]) => {
    if (job[key] !== undefined) row[column] = job[key];
  });
  return row;
}

// ------------------------------------------------------------
// Applications
// ------------------------------------------------------------
export function mapApplication(row) {
  if (!row) return null;
  return {
    id: row.id,
    jobId: row.job_id,
    workerId: row.worker_id,
    workerName: row.worker_name || '',
    workerRole: row.worker_role || '',
    workerRating: row.worker_rating == null ? 5 : asNumber(row.worker_rating, 5),
    workerReviews: asNumber(row.worker_reviews),
    companyName: row.company_name || '',
    jobTitle: row.job_title || '',
    payRate: row.pay_rate || '',
    status: row.status || 'pending',
    appliedAt: row.applied_at,
    appliedDateText: formatRelativeTime(row.applied_at),
    coverNote: row.cover_note || '',
    expectedRate: row.expected_rate || '',
    phone: row.phone || '',
  };
}

export function toApplicationRow(app = {}) {
  return {
    job_id: app.jobId,
    worker_id: app.workerId,
    worker_name: app.workerName,
    worker_role: app.workerRole,
    worker_rating: app.workerRating,
    worker_reviews: app.workerReviews,
    company_name: app.companyName,
    job_title: app.jobTitle,
    pay_rate: app.payRate,
    expected_rate: app.expectedRate,
    cover_note: app.coverNote,
    phone: app.phone,
    status: app.status || 'pending',
  };
}

// ------------------------------------------------------------
// Work history
// ------------------------------------------------------------
export function mapWorkHistory(row) {
  if (!row) return null;
  return {
    id: row.id,
    workerId: row.worker_id,
    employerId: row.employer_id,
    employerName: row.employer_name || '',
    title: row.title || '',
    category: row.category || '',
    price: row.price || '',
    completionDate: row.completion_date || '',
    status: row.status || 'completed',
    rating: row.rating == null ? null : asNumber(row.rating),
    reviewText: row.review_text || null,
    verifiedByEmployer: Boolean(row.verified_by_employer),
    skillsDemonstrated: Array.isArray(row.skills_demonstrated) ? row.skills_demonstrated : [],
    canReview: false,
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------
// Reviews
// ------------------------------------------------------------
export function mapReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    workerId: row.worker_id,
    employerId: row.employer_id,
    employerName: row.employer_name || '',
    title: row.title || 'Completed Project',
    rating: row.rating == null ? 5 : asNumber(row.rating, 5),
    date: formatDate(row.created_at),
    comment: row.comment || '',
    verified: row.verified !== false,
    createdAt: row.created_at,
  };
}

export function toReviewRow(review = {}) {
  return {
    worker_id: review.workerId,
    employer_id: review.employerId,
    employer_name: review.employerName,
    title: review.title || 'Completed Project',
    rating: review.rating,
    comment: review.comment,
    verified: review.verified !== false,
  };
}

// ------------------------------------------------------------
// Conversations & messages
// ------------------------------------------------------------
export function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name || '',
    text: row.text || '',
    time: formatClockTime(row.created_at),
    createdAt: row.created_at,
  };
}

export function mapConversation(row) {
  if (!row) return null;
  const messages = Array.isArray(row.messages)
    ? [...row.messages]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(mapMessage)
    : [];
  const last = messages[messages.length - 1];
  return {
    id: row.id,
    participant1Id: row.participant1_id,
    participant2Id: row.participant2_id,
    participant1Name: row.participant1_name || '',
    participant2Name: row.participant2_name || '',
    jobId: row.job_id || '',
    jobTitle: row.job_title || 'General Discussion',
    lastMessage: row.last_message || last?.text || '',
    lastMessageTime: row.last_message_time || last?.time || formatRelativeTime(row.created_at),
    unreadCount: asNumber(row.unread_count),
    messages,
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------
// Notifications
// ------------------------------------------------------------
export function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type || 'job',
    title: row.title || '',
    message: row.message || '',
    date: formatRelativeTime(row.created_at),
    read: Boolean(row.read),
    link: row.link || '',
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------
// Merge helpers
// ------------------------------------------------------------
/**
 * Merge freshly fetched live rows over seed/sample content.
 * Live rows always win (by id); sample rows that have no live
 * counterpart are kept so the marketplace never looks empty.
 */
export function mergeById(liveRows = [], seedRows = []) {
  const live = (liveRows || []).filter(Boolean);
  const liveIds = new Set(live.map((row) => row.id));
  const seed = (seedRows || []).filter((row) => row && !liveIds.has(row.id));
  return [...live, ...seed];
}
