// Usamos el SDK de Firebase para el servidor (Admin)
const admin = require('firebase-admin');

// --- Configuración de las credenciales de Firebase ---
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
        headers: { "Content-Type": "text/plain" },
        body: "" // Devuelve un cuerpo vacío si no hay datos
      };
    }

    const submissions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      submissions.push({
        company_uuid: data.company_uuid,
        sales_manager: data.sales_manager,
        expected_originations: data.expected_originations,
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null
      });
    });

    // --- CAMBIO CLAVE: Formatear como JSON Lines ---
    // Convierte cada objeto a un string JSON y los une con un salto de línea.
    const jsonlData = submissions.map(row => JSON.stringify(row)).join('\n');

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/jsonl", // Tipo de contenido para JSON Lines
        "Access-Control-Allow-Origin": "*" // Permite que Tableau acceda
      },
      body: jsonlData
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data.' })
    };
  }
};