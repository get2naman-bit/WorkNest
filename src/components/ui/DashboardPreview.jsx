import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, BadgeCheck, Star, MessageCircle, ChevronRight, ClipboardCheck,
  CalendarDays, Clock, FileSearch, Wrench,
} from 'lucide-react';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';
import {
  sidebarItems,
  profile,
  profileOverview,
  profileReviews,
  profileAbout,
  completedJobs,
  applicants,
} from '../../data/content.js';
import './DashboardPreview.css';

const statIcons = { check: ClipboardCheck, calendar: CalendarDays, clock: Clock };
const TABS = ['Overview', 'Completed Jobs', 'Reviews', 'About'];

export default function DashboardPreview({ view = 'worker', compact = false }) {
  const [tab, setTab] = useState(compact ? 'Overview' : 'Completed Jobs');
  const navigate = useNavigate();

  return (
    <div className={`dash ${compact ? 'dash--compact' : ''}`}>
      <div className="dash__body">
        <aside className="dash__side">
          <div className="dash__logo"><Logo size="md" /></div>
          <ul>
            {sidebarItems.map(({ icon: Icon, label, badge }, i) => (
              <li key={label} className={i === 0 ? 'is-active' : ''}>
                <Icon size={14} /> <span>{label}</span>
                {badge && <em>{badge}</em>}
              </li>
            ))}
          </ul>
          <div className="dash__help">
            <FileSearch size={34} strokeWidth={1.4} color="#1a6fe0" />
            <strong>Need help finding the right worker?</strong>
            <small>Post a job and get matched with top professionals.</small>
            <button type="button" onClick={() => navigate('/jobs/new')}>Post a Job</button>
          </div>
        </aside>

        <section className="dash__main">
          {view === 'worker' ? (
            <>
              <div className="dash__profile">
                <Avatar size={140} />
                <div className="dash__info">
                  <h3>{profile.name}</h3>
                  <p className="dash__role">{profile.role} <BadgeCheck size={14} fill="#1a6fe0" color="#fff" /></p>
                  <p className="dash__loc"><MapPin size={11} /> {profile.location}</p>
                  <p className="dash__rating">
                    <Star size={13} fill="#f5a524" color="#f5a524" /> <b>{profile.rating}</b>
                    <span>{profile.reviews} reviews</span>
                  </p>
                  <div className="dash__tags">
                    {profile.tags.map((t) => <span key={t}>{t}</span>)}
                  </div>
                  <button type="button" className="dash__msg" onClick={() => navigate('/messages')}><MessageCircle size={12} /> Message</button>
                </div>

                <div className="dash__stats">
                  {profile.stats.map((s) => {
                    const Icon = statIcons[s.icon];
                    return (
                      <div key={s.label}>
                        <span className="dash__statIcon"><Icon size={16} /></span>
                        <div><small>{s.label}</small><strong>{s.value}</strong></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dash__tabs" role="tablist">
                {TABS.map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t}
                    className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>
                ))}
              </div>

              <div className="dash__jobs">
                {tab === 'Overview' && (
                  <>
                    <h4>Profile Overview</h4>
                    <ul className="dash__facts">
                      {profileOverview.map((f) => (
                        <li key={f.label}>
                          <span className="dash__jobTitle">{f.label}</span>
                          <span className="dash__price">{f.value}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {tab === 'Completed Jobs' && (
                  <>
                    <h4>Completed Jobs</h4>
                    <ul>
                      {completedJobs.map((j) => (
                        <li key={j.title}>
                          <span className="dash__thumb" style={{ background: j.tone }}><Wrench size={16} color="#6b7a8c" /></span>
                          <span className="dash__jobTitle">{j.title}</span>
                          <span className="dash__price">{j.price}</span>
                          <span className="dash__paid">Paid</span>
                          <span className="dash__score"><Star size={11} fill="#f5a524" color="#f5a524" /> {j.rating}</span>
                          <ChevronRight size={14} color="#98a2b3" />
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {tab === 'Reviews' && (
                  <>
                    <h4>Client Reviews</h4>
                    <ul className="dash__reviews">
                      {profileReviews.map((r) => (
                        <li key={r.author}>
                          <div className="dash__reviewHead">
                            <span className="dash__jobTitle">{r.author}<small>{r.date}</small></span>
                            <span className="dash__score"><Star size={11} fill="#f5a524" color="#f5a524" /> {r.rating}</span>
                          </div>
                          <p>{r.comment}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {tab === 'About' && (
                  <>
                    <h4>About {profile.name}</h4>
                    <p className="dash__about">{profileAbout.bio}</p>
                    <ul className="dash__facts">
                      {profileAbout.details.map(([label, value]) => (
                        <li key={label}>
                          <span className="dash__jobTitle">{label}</span>
                          <span className="dash__price">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="dash__jobs dash__jobs--employer">
              <h4>Applicants · Water Heater Replacement</h4>
              <ul>
                {applicants.map((a) => (
                  <li key={a.name}>
                    <span className="dash__thumb dash__thumb--round">{a.name[0]}</span>
                    <span className="dash__jobTitle">{a.name}<small>{a.role}</small></span>
                    <span className={`dash__status dash__status--${a.status.toLowerCase()}`}>{a.status}</span>
                    <ChevronRight size={14} color="#98a2b3" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <footer className="dash__foot">
        <span>© 2024 WorkNest. All rights reserved.</span>
        <span><a>Terms of Service</a><a>Privacy Policy</a><a>Contact Us</a></span>
      </footer>
    </div>
  );
}
