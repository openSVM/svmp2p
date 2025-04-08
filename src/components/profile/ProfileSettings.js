import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ProfileSettings component allows users to customize their profile settings
 */
const ProfileSettings = ({ settings, onSaveSettings }) => {
  const [profileSettings, setProfileSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileSettings({
      ...profileSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(profileSettings);
    setIsEditing(false);
  };
  
  return (
    <div className="profile-settings card">
      <div className="card-header">
        <h3 className="card-title">Profile Settings</h3>
        {!isEditing && (
          <button 
            className="button button-outline button-sm"
            onClick={() => setIsEditing(true)}
          >
            Edit Settings
          </button>
        )}
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <h4>Display Preferences</h4>
            
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                className="form-input"
                value={profileSettings.displayName}
                onChange={handleChange}
                placeholder="Enter a display name"
                maxLength={30}
              />
              <p className="form-help-text">
                This name will be displayed to other users
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                className="form-textarea"
                value={profileSettings.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself"
                maxLength={160}
                rows={3}
              />
              <p className="form-help-text">
                {160 - (profileSettings.bio?.length || 0)} characters remaining
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="showReputationScore"
                  checked={profileSettings.showReputationScore}
                  onChange={handleChange}
                />
                <span>Show reputation score publicly</span>
              </label>
            </div>
            
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="showTransactionHistory"
                  checked={profileSettings.showTransactionHistory}
                  onChange={handleChange}
                />
                <span>Show transaction history publicly</span>
              </label>
            </div>
          </div>
          
          <div className="form-section">
            <h4>Notification Settings</h4>
            
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={profileSettings.emailNotifications}
                  onChange={handleChange}
                />
                <span>Email notifications</span>
              </label>
            </div>
            
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="browserNotifications"
                  checked={profileSettings.browserNotifications}
                  onChange={handleChange}
                />
                <span>Browser notifications</span>
              </label>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="notificationFrequency">
                Notification Frequency
              </label>
              <select
                id="notificationFrequency"
                name="notificationFrequency"
                className="form-select"
                value={profileSettings.notificationFrequency}
                onChange={handleChange}
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
            </div>
          </div>
          
          <div className="form-section">
            <h4>Privacy Settings</h4>
            
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="privateProfile"
                  checked={profileSettings.privateProfile}
                  onChange={handleChange}
                />
                <span>Make profile private</span>
              </label>
              <p className="form-help-text">
                Only users you've traded with can see your profile
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="hideWalletAddress"
                  checked={profileSettings.hideWalletAddress}
                  onChange={handleChange}
                />
                <span>Hide full wallet address</span>
              </label>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="button button-primary">
              Save Settings
            </button>
            <button 
              type="button" 
              className="button button-ghost"
              onClick={() => {
                setProfileSettings(settings);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="settings-summary">
          <div className="settings-section">
            <h4>Display Preferences</h4>
            <div className="settings-item">
              <div className="settings-label">Display Name:</div>
              <div className="settings-value">
                {profileSettings.displayName || 'Not set'}
              </div>
            </div>
            
            {profileSettings.bio && (
              <div className="settings-item">
                <div className="settings-label">Bio:</div>
                <div className="settings-value">{profileSettings.bio}</div>
              </div>
            )}
            
            <div className="settings-item">
              <div className="settings-label">Show Reputation:</div>
              <div className="settings-value">
                {profileSettings.showReputationScore ? 'Yes' : 'No'}
              </div>
            </div>
            
            <div className="settings-item">
              <div className="settings-label">Show Transactions:</div>
              <div className="settings-value">
                {profileSettings.showTransactionHistory ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h4>Notification Settings</h4>
            <div className="settings-item">
              <div className="settings-label">Email Notifications:</div>
              <div className="settings-value">
                {profileSettings.emailNotifications ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="settings-item">
              <div className="settings-label">Browser Notifications:</div>
              <div className="settings-value">
                {profileSettings.browserNotifications ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="settings-item">
              <div className="settings-label">Frequency:</div>
              <div className="settings-value">
                {profileSettings.notificationFrequency === 'immediate' ? 'Immediate' :
                 profileSettings.notificationFrequency === 'hourly' ? 'Hourly Digest' :
                 profileSettings.notificationFrequency === 'daily' ? 'Daily Digest' :
                 'Weekly Digest'}
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h4>Privacy Settings</h4>
            <div className="settings-item">
              <div className="settings-label">Private Profile:</div>
              <div className="settings-value">
                {profileSettings.privateProfile ? 'Yes' : 'No'}
              </div>
            </div>
            
            <div className="settings-item">
              <div className="settings-label">Hide Wallet Address:</div>
              <div className="settings-value">
                {profileSettings.hideWalletAddress ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProfileSettings.propTypes = {
  settings: PropTypes.shape({
    displayName: PropTypes.string,
    bio: PropTypes.string,
    showReputationScore: PropTypes.bool,
    showTransactionHistory: PropTypes.bool,
    emailNotifications: PropTypes.bool,
    browserNotifications: PropTypes.bool,
    notificationFrequency: PropTypes.string,
    privateProfile: PropTypes.bool,
    hideWalletAddress: PropTypes.bool,
  }),
  onSaveSettings: PropTypes.func.isRequired,
};

ProfileSettings.defaultProps = {
  settings: {
    displayName: '',
    bio: '',
    showReputationScore: true,
    showTransactionHistory: false,
    emailNotifications: true,
    browserNotifications: true,
    notificationFrequency: 'immediate',
    privateProfile: false,
    hideWalletAddress: false,
  },
};

export default ProfileSettings;
