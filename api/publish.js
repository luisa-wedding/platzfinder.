// Vercel Serverless Function.
// Läuft NUR auf dem Server – der Token wird nie an den Browser geschickt.
//
// Owner/Repo/Branch sind nicht geheim und stehen direkt hier im Code -
// einfach unten eintragen. Nur der Token wird als Environment-Variable
// in den Vercel Projekt-Einstellungen gesetzt:
//   GITHUB_TOKEN -> Personal Access Token (Contents: Read & Write für dieses Repo)

const GITHUB_OWNER = "luisa-wedding";
const GITHUB_REPO = "platzfinder.";
const GITHUB_BRANCH = "main";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { path, content } = req.body || {};
  if (!path || !content) {
    res.status(400).json({ error: "path und content sind erforderlich" });
    return;
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    res.status(500).json({
      error: "Server ist nicht konfiguriert. Bitte GITHUB_TOKEN als Environment-Variable in Vercel setzen."
    });
    return;
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
    // Aktuelle Version der Datei holen (falls vorhanden), um die sha zu bekommen
    let sha;
    const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json"
      }
    });
    if (getRes.status === 200) {
      const data = await getRes.json();
      sha = data.sha;
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Update ${path} über Config-Seite`,
        content,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {})
      })
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      res.status(putRes.status).json({ error: errText });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

