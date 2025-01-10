require('dotenv').config();
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  // Add debugging
  console.log('Starting notarization...');
  console.log('Environment variables:', {
    appleId: process.env.APPLE_ID ? 'Set' : 'Not set',
    appleIdPassword: process.env.APPLE_ID_PASSWORD ? 'Set' : 'Not set',
    teamId: process.env.APPLE_TEAM_ID ? 'Set' : 'Not set'
  });

  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  console.log('App details:', { appOutDir, appName });

  try {
    await notarize({
      appBundleId: 'com.davidgirardo.chatapp',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    });
    console.log('Notarization complete!');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
}; 