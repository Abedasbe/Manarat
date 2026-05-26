import React, { useState, useEffect } from 'react';
import { Users, Trophy, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const GROUPS = Array.from({ length: 12 }, (_, i) => `${i + 1} منارة `);

const TASK_POINTS = {
  completed: 10,
  started: 5,
  notStarted: 0
};

const MEETING_POINTS = {
  joined: 15,
  missed: 0
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    padding: '40px',
    width: '100%',
    maxWidth: '500px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginLeft: '10px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    marginTop: '5px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonPrimary: {
    background: '#4299e1',
    color: 'white'
  },
  buttonSuccess: {
    background: '#48bb78',
    color: 'white'
  },
  error: {
    color: '#e53e3e',
    fontSize: '14px',
    marginTop: '10px'
  },
  success: {
    color: '#48bb78',
    fontSize: '14px',
    marginTop: '10px'
  },
  dashboard: {
    minHeight: '100vh',
    background: '#f7fafc'
  },
  dashboardHeader: {
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  taskButton: {
    flex: 1,
    padding: '20px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    minWidth: '150px'
  },
  leaderboardItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: '#f7fafc',
    borderRadius: '8px',
    marginBottom: '8px'
  }
};

export default function FirebaseCompetitionApp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', password: '', group: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesData);

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database');
      setLoading(false);
    }
  };

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getWeekString = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return weekStart.toISOString().split('T')[0];
  };

  const hasRecordedTaskToday = () => {
    if (!currentUser) return false;
    const today = getTodayString();
    return activities.some(a =>
      a.userId === currentUser.id &&
      a.type === 'task' &&
      a.date === today
    );
  };

  const hasRecordedMeetingThisWeek = () => {
    if (!currentUser) return false;
    const week = getWeekString();
    return activities.some(a =>
      a.userId === currentUser.id &&
      a.type === 'meeting' &&
      a.week === week
    );
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!signupForm.username || !signupForm.password || !signupForm.group) {
      setError('الرجاء ملء جميع الحقول');
      return;
    }

    if (signupForm.password.length < 8) {
      setError('يجب أن تكون كلمة المرور 8 خانات على الأقل');
      return;
    }

    if (users.find(u => u.username === signupForm.username)) {
      setError('إسم المستخدم موجود مسبقًا');
      return;
    }

    try {
      const newUser = {
        username: signupForm.username,
        password: signupForm.password,
        group: signupForm.group,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'users'), newUser);

      setUsers([...users, { id: docRef.id, ...newUser }]);
      setSignupForm({ username: '', password: '', group: '' });
      setSuccess('تم إنشاء الحساب بنجاح!');
      setTimeout(() => {
        setCurrentPage('login');
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Error creating account:', err);
      setError('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleLogin = () => {
    setError('');

    const user = users.find(u =>
      u.username === loginForm.username &&
      u.password === loginForm.password
    );

    if (user) {
      setCurrentUser(user);
      setCurrentPage('dashboard');
      setLoginForm({ username: '', password: '' });
    } else {
      setError('إسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleTask = async (taskType) => {
    if (hasRecordedTaskToday()) {
      setError('لقد سجلت وردك اليوم بالفعل');
      return;
    }

    const points = TASK_POINTS[taskType];

    try {
      const activity = {
        userId: currentUser.id,
        username: currentUser.username,
        group: currentUser.group,
        type: 'task',
        action: taskType,
        points,
        date: getTodayString(),
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'activities'), activity);

      setActivities([...activities, { id: docRef.id, ...activity }]);
      setError('');
      setSuccess('تم تسجيل الورد بنجاح!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error recording task:', err);
      setError('فشل تسجيل الورد. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleMeeting = async (attended) => {
    if (hasRecordedMeetingThisWeek()) {
      setError('لقد سجلت اللقاء الأسبوعي بالفعل');
      return;
    }

    const points = attended ? MEETING_POINTS.joined : MEETING_POINTS.missed;

    try {
      const activity = {
        userId: currentUser.id,
        username: currentUser.username,
        group: currentUser.group,
        type: 'meeting',
        action: attended ? 'joined' : 'missed',
        points,
        week: getWeekString(),
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'activities'), activity);

      setActivities([...activities, { id: docRef.id, ...activity }]);
      setError('');
      setSuccess('تم تسجيل اللقاء بنجاح!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error recording meeting:', err);
      setError('فشل تسجيل اللقاء. يرجى المحاولة مرة أخرى.');
    }
  };

  const getGroupScores = () => {
  const scores = {};

  GROUPS.forEach(group => {
    const groupMembers = users.filter(u => u.group === group).length;
    const groupActivities = activities.filter(a => a.group === group);

    const taskPoints = groupActivities
      .filter(a => a.type === 'task')
      .reduce((sum, a) => sum + a.points, 0);

    const meetingPoints = groupActivities
      .filter(a => a.type === 'meeting')
      .reduce((sum, a) => sum + a.points, 0);

    const totalPoints = taskPoints + meetingPoints;

    scores[group] = {
      total: totalPoints,
      taskPoints: taskPoints,
      meetingPoints: meetingPoints,
      members: groupMembers,
      average: groupMembers > 0 ? Math.round(totalPoints / groupMembers) : 0
    };
  });

  return Object.entries(scores)
    .sort((a, b) => b[1].average - a[1].average)
    .map(([group, data], index) => ({
      group,
      total: data.total,
      taskPoints: data.taskPoints,
      meetingPoints: data.meetingPoints,
      members: data.members,
      average: data.average,
      rank: index + 1
    }));
};

  const getGroupMemberScores = () => {
  if (!currentUser) return [];

  const groupUsers = users.filter(u => u.group === currentUser.group);
  const scores = groupUsers.map(user => {
    const userActivities = activities.filter(a => a.userId === user.id);

    const taskPoints = userActivities
      .filter(a => a.type === 'task')
      .reduce((sum, a) => sum + a.points, 0);

    const meetingPoints = userActivities
      .filter(a => a.type === 'meeting')
      .reduce((sum, a) => sum + a.points, 0);

    const totalPoints = taskPoints + meetingPoints;

    return {
      username: user.username,
      points: totalPoints,
      taskPoints: taskPoints,
      meetingPoints: meetingPoints
    };
  });

  return scores.sort((a, b) => b.points - a.points);
};

  if (loading) {
    return (
      <div style={{ ...styles.container, background: '#667eea' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>جارٍ التحميل...</div>
          <Trophy size={48} color="white" />
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <Trophy size={48} color="#f59e0b" />
            <h1 style={styles.title}>المنارات</h1>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>إسم المستخدم</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={styles.input}
              placeholder="أدخل إسم المستخدم"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>كلمة المرور</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={styles.input}
              placeholder="أدخل كلمة المرور"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            onClick={handleLogin}
            style={{ ...styles.button, ...styles.buttonPrimary, marginTop: '10px' }}
            onMouseOver={(e) => e.target.style.background = '#3182ce'}
            onMouseOut={(e) => e.target.style.background = '#4299e1'}
          >
            دخول
          </button>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#718096', fontSize: '14px' }}>لا يوجد لديك حساب ؟</p>
            <button
              onClick={() => { setCurrentPage('signup'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#4299e1', fontWeight: '600', cursor: 'pointer', marginTop: '5px', fontSize: '16px' }}
            >
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'signup') {
    return (
      <div style={{ ...styles.container, background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
        <div style={styles.card}>
          <div style={styles.header}>
            <Users size={48} color="#48bb78" />
            <h1 style={styles.title}>المنارات</h1>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>إسم المستخدم</label>
            <input
              type="text"
              value={signupForm.username}
              onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
              style={styles.input}
              placeholder="إختر إسم المستخدم"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>كلمة المرور (على الأقل 8 خانات)</label>
            <input
              type="password"
              value={signupForm.password}
              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
              style={styles.input}
              placeholder="إختر كلمة المرور"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>إختر منارتك</label>
            <select
              value={signupForm.group}
              onChange={(e) => setSignupForm({ ...signupForm, group: e.target.value })}
              style={styles.input}
            >
              <option value="">المنارات</option>
              {GROUPS.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}

          <button
            onClick={handleSignup}
            style={{ ...styles.button, ...styles.buttonSuccess, marginTop: '10px' }}
            onMouseOver={(e) => e.target.style.background = '#38a169'}
            onMouseOut={(e) => e.target.style.background = '#48bb78'}
          >
            إنشاء الحساب
          </button>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#718096', fontSize: '14px' }}>لديك حساب ؟</p>
            <button
              onClick={() => { setCurrentPage('login'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#48bb78', fontWeight: '600', cursor: 'pointer', marginTop: '5px', fontSize: '16px' }}
            >
              دخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.dashboardHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>السلام عليكم {currentUser.username}</h1>
            <p style={{ color: '#718096', margin: '5px 0 0 0' }}>{currentUser.group}</p>
          </div>
          <button
            onClick={() => { setCurrentUser(null); setCurrentPage('login'); setError(''); }}
            style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            onMouseOver={(e) => e.target.style.background = '#c53030'}
            onMouseOut={(e) => e.target.style.background = '#e53e3e'}
          >
            خروج
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {success && (
          <div style={{ background: '#f0fff4', border: '2px solid #48bb78', borderRadius: '8px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ color: '#22543d', fontWeight: '600', margin: 0 }}>{success}</p>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '30px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <Calendar size={24} color="#4299e1" />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '10px', margin: '0 0 0 10px' }}>الورد اليومي</h2>
          </div>

          {error && error.includes('ورد') && (
            <p style={{ ...styles.error, marginBottom: '15px' }}>{error}</p>
          )}

          {hasRecordedTaskToday() ? (
            <div style={{ background: '#f0fff4', border: '2px solid #9ae6b4', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <CheckCircle size={32} color="#48bb78" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: '#22543d', fontWeight: '600', margin: 0 }}>تم تسجيل الورد، بارك اللّه بك</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleTask('completed')}
                style={{ ...styles.taskButton, background: '#48bb78' }}
                onMouseOver={(e) => e.target.style.background = '#38a169'}
                onMouseOut={(e) => e.target.style.background = '#48bb78'}
              >
                <CheckCircle size={32} style={{ marginBottom: '10px' }} />
                <span>أتممت الورد</span>
                <span style={{ fontSize: '12px', marginTop: '5px' }}>+{TASK_POINTS.completed} نقاط</span>
              </button>

              <button
                onClick={() => handleTask('started')}
                style={{ ...styles.taskButton, background: '#ecc94b' }}
                onMouseOver={(e) => e.target.style.background = '#d69e2e'}
                onMouseOut={(e) => e.target.style.background = '#ecc94b'}
              >
                <Clock size={32} style={{ marginBottom: '10px' }} />
                <span>بدأت الورد لكن لم أنهه</span>
                <span style={{ fontSize: '12px', marginTop: '5px' }}>+{TASK_POINTS.started} نقاط</span>
              </button>

              <button
                onClick={() => handleTask('notStarted')}
                style={{ ...styles.taskButton, background: '#f56565' }}
                onMouseOver={(e) => e.target.style.background = '#e53e3e'}
                onMouseOut={(e) => e.target.style.background = '#f56565'}
              >
                <XCircle size={32} style={{ marginBottom: '10px' }} />
                <span>لم أبدأ الورد</span>
                <span style={{ fontSize: '12px', marginTop: '5px' }}>{TASK_POINTS.notStarted} نقاط</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '30px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <Users size={24} color="#9f7aea" />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '10px', margin: '0 0 0 10px' }}>اللقاء الأسبوعي</h2>
          </div>

          {error && error.includes('اللقاء') && (
            <p style={{ ...styles.error, marginBottom: '15px' }}>{error}</p>
          )}

          {hasRecordedMeetingThisWeek() ? (
            <div style={{ background: '#f0fff4', border: '2px solid #9ae6b4', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <CheckCircle size={32} color="#48bb78" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: '#22543d', fontWeight: '600', margin: 0 }}>تم تسجيل اللقاء الأسبوعي، جزاك اللّه خيرًا</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleMeeting(true)}
                style={{ ...styles.taskButton, background: '#4299e1' }}
                onMouseOver={(e) => e.target.style.background = '#3182ce'}
                onMouseOut={(e) => e.target.style.background = '#4299e1'}
              >
                <CheckCircle size={32} style={{ marginBottom: '10px' }} />
                <span>شاركت باللقاء الأسبوعي</span>
                <span style={{ fontSize: '12px', marginTop: '5px' }}>+{MEETING_POINTS.joined} نقاط</span>
              </button>

              <button
                onClick={() => handleMeeting(false)}
                style={{ ...styles.taskButton, background: '#718096' }}
                onMouseOver={(e) => e.target.style.background = '#4a5568'}
                onMouseOut={(e) => e.target.style.background = '#718096'}
              >
                <XCircle size={32} style={{ marginBottom: '10px' }} />
                <span>لم أشارك باللقاء الأسبوعي</span>
                <span style={{ fontSize: '12px', marginTop: '5px' }}>{MEETING_POINTS.missed} نقاط</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '30px' }}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
    <Trophy size={24} color="#f59e0b" />
    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '10px', margin: '0 0 0 10px' }}>لوحة المتصدرين</h2>
  </div>
  <p style={{ fontSize: '14px', color: '#718096', marginBottom: '15px', margin: '0 0 15px 0' }}>
    ترتيب حسب متوسط النقاط لكل عضو
  </p>

  <div>
    {getGroupScores().map(({ group, total, taskPoints, meetingPoints, members, average, rank }) => (
      <div
        key={group}
        style={{
          ...styles.leaderboardItem,
          background: group === currentUser.group ? '#ebf8ff' : '#f7fafc',
          border: group === currentUser.group ? '2px solid #4299e1' : 'none',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <span style={{
              fontWeight: 'bold',
              marginRight: '15px',
              color: rank === 1 ? '#f59e0b' : rank === 2 ? '#a0aec0' : rank === 3 ? '#ed8936' : '#718096',
              fontSize: rank <= 3 ? '20px' : '16px'
            }}>
              #{rank}
            </span>
            <div>
              <div style={{ fontWeight: '600' }}>{group}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>
                {members} عضو
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: '#4299e1', fontSize: '18px' }}>{average}</div>
            <div style={{ fontSize: '12px', color: '#718096' }}>متوسط/عضو</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f0f9ff', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0284c7' }}>{taskPoints}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>نقاط الورد</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>{meetingPoints}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>نقاط اللقاءات</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#faf5ff', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#9333ea' }}>{total}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>المجموع</div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '30px' }}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
    <Users size={24} color="#48bb78" />
    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '10px', margin: '0 0 0 10px' }}>{currentUser.group}</h2>
  </div>

  <div>
    {getGroupMemberScores().length > 0 ? (
      getGroupMemberScores().map((member, index) => (
        <div
          key={member.username}
          style={{
            ...styles.leaderboardItem,
            background: member.username === currentUser.username ? '#f0fff4' : '#f7fafc',
            border: member.username === currentUser.username ? '2px solid #48bb78' : 'none',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontWeight: 'bold',
                marginRight: '15px',
                color: index === 0 ? '#f59e0b' : index === 1 ? '#a0aec0' : index === 2 ? '#ed8936' : '#718096',
                fontSize: index <= 2 ? '20px' : '16px'
              }}>
                #{index + 1}
              </span>
              <span style={{ fontWeight: '600' }}>{member.username}</span>
            </div>
            <span style={{ fontWeight: 'bold', color: '#48bb78', fontSize: '18px' }}>{member.points}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f0f9ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0284c7' }}>{member.taskPoints}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>نقاط الورد</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>{member.meetingPoints}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>نقاط اللقاءات</div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p style={{ color: '#718096', textAlign: 'center', padding: '20px', margin: 0 }}>لا يوجد أعضاء في هذه المنارة بعد</p>
    )}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}