import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import PropertyValueTable from '../common/PropertyValueTable';
import ThemeSelector from '../ThemeSelector';

/**
 * ProfileSettings component allows users to customize their profile settings,
 * including theme and language preferences
 */
const ProfileSettings = ({ settings, onSaveSettings }) => {
  // Initialize with safe defaults if settings is null/undefined - using useMemo to prevent dependency issues
  const defaultSettings = useMemo(() => ({
    displayName: '',
    bio: '',
    showReputationScore: true,
    showTransactionHistory: false,
    emailNotifications: true,
    browserNotifications: true,
    notificationFrequency: 'immediate',
    privateProfile: false,
    hideWalletAddress: false,
  }), []);
  
  const safeSettings = settings || defaultSettings;
  const [profileSettings, setProfileSettings] = useState(safeSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('blueprint');
  
  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'blueprint';
    setCurrentTheme(savedTheme);
  }, []);
  
  // Update profileSettings when settings prop changes
  useEffect(() => {
    const safeSettings = settings || defaultSettings;
    setProfileSettings(safeSettings);
  }, [settings, defaultSettings]);

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

  // Handle theme change
  const handleThemeChange = (themeKey) => {
    setCurrentTheme(themeKey);
    localStorage.setItem('theme', themeKey);
    // Theme will be applied by the ThemeSelector component
  };

  // Get current language name from localStorage
  const getCurrentLanguageName = () => {
    const savedLanguage = localStorage.getItem('preferred-language') || 'en';
    const languages = [
      { code: 'en', name: 'English', country: '🇺🇸' },
      { code: 'es', name: 'Español', country: '🇪🇸' },
      { code: 'fr', name: 'Français', country: '🇫🇷' },
      { code: 'de', name: 'Deutsch', country: '🇩🇪' },
      { code: 'ja', name: '日本語', country: '🇯🇵' },
      { code: 'ko', name: '한국어', country: '🇰🇷' },
      { code: 'zh', name: '中文', country: '🇨🇳' }
    ];
    const lang = languages.find(l => l.code === savedLanguage);
    return lang ? `${lang.country} ${lang.name}` : '🇺🇸 English';
  };

  // Get current theme name
  const getCurrentThemeName = () => {
    const themeNames = {
      'blueprint': 'BLUEPRINT',
      'grayscale': 'GRAYSCALE', 
      'corporate': 'CORPORATE',
      'retro': 'RETRO',
      'terminal': 'TERMINAL',
      'minimal': 'MINIMAL',
      'cyberpunk': 'CYBERPUNK',
      'organic': 'ORGANIC',
      'high-contrast': 'HIGH CONTRAST',
      'pastel': 'PASTEL'
    };
    return themeNames[currentTheme] || 'BLUEPRINT';
  };

  // Prepare interface preferences data
  const interfacePreferencesData = [
    { 
      property: 'THEME', 
      value: getCurrentThemeName(),
      description: 'Current visual theme - use theme selector to change'
    },
    { 
      property: 'LANGUAGE', 
      value: getCurrentLanguageName(),
      description: 'Interface language - change in header navigation'
    },
  ];
  // Prepare display preferences data
  const displayPreferencesData = [
    { 
      property: 'DISPLAY NAME', 
      value: profileSettings.displayName || 'NOT SET',
      valueClassName: profileSettings.displayName ? 'has-value' : 'no-value'
    },
    { 
      property: 'BIO', 
      value: profileSettings.bio || 'NOT SET',
      valueClassName: profileSettings.bio ? 'has-value' : 'no-value',
      description: profileSettings.bio ? `${profileSettings.bio.length}/160 characters` : null
    },
    { 
      property: 'SHOW REPUTATION SCORE', 
      value: profileSettings.showReputationScore ? 'YES' : 'NO',
      badge: profileSettings.showReputationScore ? 'ENABLED' : 'DISABLED',
      badgeClassName: profileSettings.showReputationScore ? 'badge-success' : 'badge-neutral'
    },
    { 
      property: 'SHOW TRANSACTION HISTORY', 
      value: profileSettings.showTransactionHistory ? 'YES' : 'NO',
      badge: profileSettings.showTransactionHistory ? 'ENABLED' : 'DISABLED',
      badgeClassName: profileSettings.showTransactionHistory ? 'badge-success' : 'badge-neutral'
    },
  ];

  // Prepare notification settings data
  const notificationSettingsData = [
    { 
      property: 'EMAIL NOTIFICATIONS', 
      value: profileSettings.emailNotifications ? 'ENABLED' : 'DISABLED',
      badge: profileSettings.emailNotifications ? 'ON' : 'OFF',
      badgeClassName: profileSettings.emailNotifications ? 'badge-success' : 'badge-neutral'
    },
    { 
      property: 'BROWSER NOTIFICATIONS', 
      value: profileSettings.browserNotifications ? 'ENABLED' : 'DISABLED',
      badge: profileSettings.browserNotifications ? 'ON' : 'OFF',
      badgeClassName: profileSettings.browserNotifications ? 'badge-success' : 'badge-neutral'
    },
    { 
      property: 'NOTIFICATION FREQUENCY', 
      value: profileSettings.notificationFrequency === 'immediate' ? 'IMMEDIATE' :
             profileSettings.notificationFrequency === 'hourly' ? 'HOURLY DIGEST' :
             profileSettings.notificationFrequency === 'daily' ? 'DAILY DIGEST' :
             'WEEKLY DIGEST'
    },
  ];

  // Prepare privacy settings data
  const privacySettingsData = [
    { 
      property: 'PRIVATE PROFILE', 
      value: profileSettings.privateProfile ? 'YES' : 'NO',
      badge: profileSettings.privateProfile ? 'PRIVATE' : 'PUBLIC',
      badgeClassName: profileSettings.privateProfile ? 'badge-warning' : 'badge-success',
      description: profileSettings.privateProfile ? 'Only users you\'ve traded with can see your profile' : null
    },
    { 
      property: 'HIDE WALLET ADDRESS', 
      value: profileSettings.hideWalletAddress ? 'YES' : 'NO',
      badge: profileSettings.hideWalletAddress ? 'HIDDEN' : 'VISIBLE',
      badgeClassName: profileSettings.hideWalletAddress ? 'badge-warning' : 'badge-neutral'
    },
  ];

  const settingsActions = (
    <div className="settings-actions">
      {!isEditing ? (
        <button 
          className="button button-outline button-sm"
          onClick={() => setIsEditing(true)}
        >
          EDIT SETTINGS
        </button>
      ) : (
        <div className="edit-actions">
          <button 
            className="button button-primary button-sm"
            onClick={handleSubmit}
          >
            SAVE CHANGES
          </button>
          <button 
            className="button button-secondary button-sm"
            onClick={() => {
              setProfileSettings(safeSettings);
              setIsEditing(false);
            }}
          >
            CANCEL
          </button>
        </div>
      )}
    </div>
  );

  if (isEditing) {
    return (
      <div className="profile-settings-edit">
        <div className="app-form">
          <div className="app-form-header">EDIT PROFILE SETTINGS</div>
          
          <form onSubmit={handleSubmit}>
            <div className="app-form-section">
              <div className="app-form-section-title">INTERFACE PREFERENCES</div>
              
              <div className="app-form-row-1">
                <div className="app-field">
                  <label>THEME</label>
                  <div className="theme-selector-container">
                    <ThemeSelector 
                      value={currentTheme}
                      onChange={handleThemeChange}
                      className="profile-theme-selector"
                    />
                  </div>
                  <div className="app-field-help">Choose your preferred visual theme</div>
                </div>
              </div>
              
              <div className="app-form-info">
                <p>💡 Language settings have been moved to the header navigation for easier access.</p>
                <p>You can change your language preference using the language selector in the top navigation bar.</p>
              </div>
            </div>

            <style jsx>{`
              .profile-theme-selector {
                width: 100%;
                background: var(--color-background);
                border: 1px solid var(--color-border);
                border-radius: 0;
              }
              
              .profile-theme-selector .app-header-control {
                width: 100%;
                background: var(--color-background);
                border: 1px solid var(--color-border);
                color: var(--color-foreground);
                padding: 8px 12px;
                border-radius: 0;
                font-family: inherit;
                font-size: 14px;
                text-align: left;
              }
              
              .profile-theme-selector .app-dropdown-menu {
                width: 100%;
                max-width: none;
                left: 0 !important;
                right: 0;
              }
              
              .app-form-info {
                background: var(--secondary-bg);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius, 0px);
                padding: 12px;
                margin-top: 16px;
                font-size: var(--font-size-sm, 12px);
                color: var(--text-muted);
              }
              
              .app-form-info p {
                margin: 0 0 8px 0;
              }
              
              .app-form-info p:last-child {
                margin-bottom: 0;
              }
            `}</style>

            <div className="app-form-section">
              <div className="app-form-section-title">DISPLAY PREFERENCES</div>
              
              <div className="app-form-row-2">
                <div className="app-field">
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
                  <div className="app-field-help">This name will be displayed to other users</div>
                </div>
                
                <div className="app-field">
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
                  <div className="app-field-help">
                    {160 - (profileSettings.bio?.length || 0)} characters remaining
                  </div>
                </div>
              </div>
              
              <div className="app-form-row-2">
                <div className="app-field-inline">
                  <label className="app-checkbox">
                    <input
                      type="checkbox"
                      name="showReputationScore"
                      checked={profileSettings.showReputationScore}
                      onChange={handleChange}
                    />
                    SHOW REPUTATION SCORE PUBLICLY
                  </label>
                </div>
                
                <div className="app-field-inline">
                  <label className="app-checkbox">
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
            
            <div className="app-form-section">
              <div className="app-form-section-title">NOTIFICATION SETTINGS</div>
              
              <div className="app-form-row-3">
                <div className="app-field-inline">
                  <label className="app-checkbox">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={profileSettings.emailNotifications}
                      onChange={handleChange}
                    />
                    EMAIL NOTIFICATIONS
                  </label>
                </div>
                
                <div className="app-field-inline">
                  <label className="app-checkbox">
                    <input
                      type="checkbox"
                      name="browserNotifications"
                      checked={profileSettings.browserNotifications}
                      onChange={handleChange}
                    />
                    BROWSER NOTIFICATIONS
                  </label>
                </div>
                
                <div className="app-field">
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
            
            <div className="app-form-section">
              <div className="app-form-section-title">PRIVACY SETTINGS</div>
              
              <div className="app-form-row-2">
                <div className="app-field-inline">
                  <label className="app-checkbox">
                    <input
                      type="checkbox"
                      name="privateProfile"
                      checked={profileSettings.privateProfile}
                      onChange={handleChange}
                    />
                    MAKE PROFILE PRIVATE
                  </label>
                  <div className="app-field-help">
                    Only users you've traded with can see your profile
                  </div>
                </div>
                
                <div className="app-field-inline">
                  <label className="app-checkbox">
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
            
            <div className="app-form-actions">
              <button type="submit" className="app-button-primary">
                SAVE SETTINGS
              </button>
              <button 
                type="button" 
                className="app-button-secondary"
                onClick={() => {
                  setProfileSettings(safeSettings);
                  setIsEditing(false);
                }}
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-settings">
      <PropertyValueTable
        title="Interface Preferences"
        data={interfacePreferencesData}
        className="interface-preferences-table"
      />
      
      <PropertyValueTable
        title="Display Preferences"
        data={displayPreferencesData}
        className="display-preferences-table"
      />
      
      <PropertyValueTable
        title="Notification Settings"
        data={notificationSettingsData}
        className="notification-settings-table"
      />
      
      <PropertyValueTable
        title="Privacy Settings"
        data={privacySettingsData}
        actions={settingsActions}
        className="privacy-settings-table"
      />
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
  settings: null, // Allow null settings, component will use defaults
};

export default ProfileSettings;