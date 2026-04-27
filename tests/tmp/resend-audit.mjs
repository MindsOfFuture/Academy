import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "noreply@mindsofthefuture.com";

if (!apiKey) {
    console.error("RESEND_API_KEY não configurada");
    process.exit(1);
}

const payload = {
    from,
    to: "mindsofthefuture.ufjf@gmail.com",
    subject: "Teste auditoria - reprovação de cadastro",
    html: "<div style='font-family:Segoe UI,Arial,sans-serif'><h2>Solicitação reprovada</h2><p>Teste de auditoria de envio Resend.</p></div>",
};

async function run() {
    const sendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const sendBody = await sendResponse.text();
    console.log("SEND_STATUS", sendResponse.status);
    console.log("SEND_BODY", sendBody);

    let id = null;
    try {
        const parsed = JSON.parse(sendBody);
        id = parsed?.id || parsed?.data?.id || null;
    } catch {
        id = null;
    }

    if (!id) {
        console.log("GET_SKIPPED", "No id returned from send response");
        return;
    }

    const getResponse = await fetch(`https://api.resend.com/emails/${id}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });

    const getBody = await getResponse.text();
    console.log("GET_STATUS", getResponse.status);
    console.log("GET_BODY", getBody);
}

run().catch((error) => {
    console.error("SCRIPT_ERROR", error?.message || error);
    process.exit(1);
});
