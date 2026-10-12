import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Save, Shield, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    address: user?.address || '',
    department: user?.department || '',
    jobTitle: user?.jobTitle || '',
    bio: user?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    try {
      const res = await api.post('/upload/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update user state with new profile picture
      const updatedUser = { ...user, profilePicture: res.data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem('ci_user', JSON.stringify(updatedUser));
      
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePicture = async () => {
    try {
      await api.delete('/upload/profile-picture');
      
      // Update user state
      const updatedUser = { ...user, profilePicture: null };
      setUser(updatedUser);
      localStorage.setItem('ci_user', JSON.stringify(updatedUser));
      
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove picture');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      const updated = res.data.user;
      setUser(updated);
      localStorage.setItem('ci_user', JSON.stringify(updated));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h2>My Profile</h2><p>Manage your account settings</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, maxWidth: 800 }}>
        {/* Avatar card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 16px' }}>
            {user?.profilePicture ? (
              <img 
                src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${user.profilePicture}`} 
                alt="Profile" 
                style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid var(--accent)'
                }} 
              />
            ) : (
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 32, 
                fontWeight: 800, 
                color: '#fff' 
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-icon"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--accent)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? (
                <div className="spinner" style={{ width: 12, height: 12, border: '2px solid white', borderTop: '2px solid transparent' }} />
              ) : (
                <Camera size={12} />
              )}
            </button>
            
            {/* Remove picture button */}
            {user?.profilePicture && (
              <button
                onClick={handleRemovePicture}
                className="btn-icon"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'var(--danger)',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
          {user?.jobTitle && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.jobTitle}</div>
          )}
          {user?.department && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.department}</div>
          )}
          {user?.phoneNumber && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.phoneNumber}</div>
          )}
          <div style={{ marginTop: 10 }}>
            <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
              <Shield size={11} /> {user?.role}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Edit Information</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input id="profile-name" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  id="profile-phone" 
                  className="form-control" 
                  value={form.phoneNumber} 
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input 
                  id="profile-dob" 
                  type="date" 
                  className="form-control" 
                  value={form.dateOfBirth} 
                  onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  id="profile-department" 
                  className="form-control" 
                  value={form.department} 
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                >
                  <option value="">Select Department</option>
                  <option value="Management">Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">Human Resources</option>
                  <option value="Operations">Operations</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input 
                  id="profile-job-title" 
                  className="form-control" 
                  value={form.jobTitle} 
                  onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="e.g. Warehouse Manager"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" value={user?.email} disabled style={{ opacity: 0.5 }} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea 
                id="profile-address" 
                className="form-control" 
                value={form.address} 
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Enter your address"
                rows={2}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Bio / About Me</label>
              <textarea 
                id="profile-bio" 
                className="form-control" 
                value={form.bio} 
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-control" value={user?.role} disabled style={{ opacity: 0.5, textTransform: 'capitalize' }} />
            </div>
            
            <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
