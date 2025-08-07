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
        <div className="ascii-form">
          <div className="ascii-form-header">PROFILE SETTINGS</div>
          
          <form onSubmit={handleSubmit}>
            <div className="ascii-form-section">
              <div className="ascii-form-section-title">DISPLAY PREFERENCES</div>
              
              <div className="ascii-form-row-2">
                <div className="ascii-field">
                  <label htmlFor="displayName">DISPLAY NAME</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profileSettings.displayName}
                    onChange={handleChange}
                    placeholder="Enter display name"
                    maxLength={30}
                  />
                  <div className="ascii-field-help">This name will be displayed to other users</div>
                </div>
                
                <div className="ascii-field">
                  <label htmlFor="bio">BIO</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileSettings.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself"
                    maxLength={160}
                    rows={3}
                  />
                  <div className="ascii-field-help">
                    {160 - (profileSettings.bio?.length || 0)} characters remaining
                  </div>
                </div>
              </div>
              
              <div className="ascii-form-row-2">
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="showReputationScore"
                      checked={profileSettings.showReputationScore}
                      onChange={handleChange}
                    />
                    SHOW REPUTATION SCORE PUBLICLY
                  </label>
                </div>
                
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="showTransactionHistory"
                      checked={profileSettings.showTransactionHistory}
                      onChange={handleChange}
                    />
                    SHOW TRANSACTION HISTORY PUBLICLY
                  </label>
                </div>
              </div>
            </div>
            
            <div className="ascii-form-section">
              <div className="ascii-form-section-title">NOTIFICATION SETTINGS</div>
              
              <div className="ascii-form-row-3">
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={profileSettings.emailNotifications}
                      onChange={handleChange}
                    />
                    EMAIL NOTIFICATIONS
                  </label>
                </div>
                
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="browserNotifications"
                      checked={profileSettings.browserNotifications}
                      onChange={handleChange}
                    />
                    BROWSER NOTIFICATIONS
                  </label>
                </div>
                
                <div className="ascii-field">
                  <label htmlFor="notificationFrequency">FREQUENCY</label>
                  <select
                    id="notificationFrequency"
                    name="notificationFrequency"
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
            </div>
            
            <div className="ascii-form-section">
              <div className="ascii-form-section-title">PRIVACY SETTINGS</div>
              
              <div className="ascii-form-row-2">
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="privateProfile"
                      checked={profileSettings.privateProfile}
                      onChange={handleChange}
                    />
                    MAKE PROFILE PRIVATE
                  </label>
                  <div className="ascii-field-help">
                    Only users you've traded with can see your profile
                  </div>
                </div>
                
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="hideWalletAddress"
                      checked={profileSettings.hideWalletAddress}
                      onChange={handleChange}
                    />
                    HIDE FULL WALLET ADDRESS
                  </label>
                </div>
              </div>
            </div>
            
            <div className="ascii-form-actions">
              <button type="submit" className="ascii-button-primary">
                SAVE SETTINGS
              </button>
              <button 
                type="button" 
                className="ascii-button-secondary"
                onClick={() => {
                  setProfileSettings(settings);
                  setIsEditing(false);
                }}
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
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
