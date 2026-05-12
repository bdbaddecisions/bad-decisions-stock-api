exports.handler = async function(event) {
  try {
    const data = JSON.parse(event.body || "{}");

    const email = data.email;
    const source = (data.source || "direct")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .toLowerCase();

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing email" })
      };
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        listIds: [5],
        updateEnabled: true,
        attributes: {
          SIGNUP_SOURCE: source
        }
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: response.ok })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Server error" })
    };
  }
};