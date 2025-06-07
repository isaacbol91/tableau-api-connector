// Usamos el SDK de Firebase para el servidor (Admin)
const admin = require('firebase-admin');

// --- Configuración de las credenciales de Firebase ---
// Estas se guardarán de forma segura en Netlify, no aquí en el código.
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Inicializar la app de Firebase si no se ha hecho ya
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// --- Lógica principal de la función ---
exports.handler = async function(event, context) {
  try {
    const submissionsRef = db.collection('tableau-submissions');
    const snapshot = await submissionsRef.get();

    if (snapshot.empty) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([])
      };
    }

    const submissions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      submissions.push({
        company_uuid: data.company_uuid,
        sales_manager: data.sales_manager,
        expected_originations: data.expected_originations,
        // Formatear la fecha para que Tableau la entienda
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null
      });
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Permite que Tableau acceda
      },
      body: JSON.stringify(submissions)
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data.' })
    };
  }
};
