// Netlify Identity event hook: auto-confirm signups and assign admin role
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const { user } = data;
    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          roles: ["admin"]
        }
      })
    };
  } catch (e) {
    return { statusCode: 200, body: '{}' };
  }
};
