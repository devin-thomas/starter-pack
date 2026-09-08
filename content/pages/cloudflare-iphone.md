Put a small static website online from your iPhone using Cloudflare's folder upload. Your agent can prepare the files; Safari and the Files app handle the upload.

**Tested September 8, 2026:** Devin reported completing this workflow on an iPhone using ChatGPT, Files, Safari, and an existing Cloudflare account. You can ask another chat app or agent to produce the same files. This test did not cover choosing between multiple Cloudflare accounts.

Use your existing static app, or ask your agent for a small example as a downloadable ZIP:

```text
Make a small static website I can upload to Cloudflare from my iPhone.
Use HTML, CSS, and browser JavaScript. Package it as a downloadable ZIP
with index.html at the root of the extracted folder, alongside any CSS
and JavaScript files. Use relative links between the files.

Include a Say Hello button, a Reset button, and Size and Radius sliders
so I can check the deployed page's behavior. Explain what each control
should do and what Reset restores.

This is a static folder upload. It must work without a terminal, IDE,
Git, Wrangler, server-side runtime code, or build configuration.
```

Save the ZIP to the Files app. Tap it there to extract a folder. Keep that folder somewhere you can find again when Safari opens the file picker. If your agent supplies individual files, save them together in one folder with `index.html` directly inside it. The uploaded folder contains ready-to-serve website files, rather than source that still needs a build step.

Tap a screenshot to view it full size; use Back to return.

## 1. Open Workers & Pages

In Safari, sign in to Cloudflare and open [Workers & Pages](https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fworkers-and-pages). Tap **Create application**.

The screenshots begin with an existing account already selected. If Cloudflare asks you to choose an account, select the one you intend to use before continuing; that selection screen was outside this test.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/01.jpg" aria-label="Open screenshot 1 at full size"><img src="/help/cloudflare-iphone/01.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Cloudflare Workers & Pages dashboard in iPhone Safari with the Create application button near the top."></a>
<figcaption>1. Start with Create application in Workers & Pages.</figcaption>
</figure>
</div>

## 2. Choose the static upload

On **Make something new**, tap **Upload your static files**. The next screen is **Upload and deploy**. Tap the **folder** link inside the upload area to open the iPhone file picker.

This tested route uses Workers static upload. The **Continue to Pages** link leads to a different workflow.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/02.jpg" aria-label="Open screenshot 2 at full size"><img src="/help/cloudflare-iphone/02.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Cloudflare Make something new screen with Upload your static files below the repository and template options."></a>
<figcaption>2. Choose Upload your static files.</figcaption>
</figure>
<figure>
<a href="/help/cloudflare-iphone/03.jpg" aria-label="Open screenshot 3 at full size"><img src="/help/cloudflare-iphone/03.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Upload and deploy screen showing separate file and folder links inside an empty upload area."></a>
<figcaption>3. Tap folder to select the extracted website folder.</figcaption>
</figure>
</div>

## 3. Open the extracted folder

In the file picker, go to where you saved the download. Open the extracted folder beside the ZIP. Inside it, confirm that you can see `index.html` alongside the website's other files, then tap **Open** in the upper-right corner to select that folder.

In this example, the folder contains `index.html`, `script.js`, and `styles.css`. Your filenames can differ, but `index.html` must be at the folder root. If another folder is the only thing inside, open that inner folder until you reach the actual website files.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/04.jpg" aria-label="Open screenshot 4 at full size"><img src="/help/cloudflare-iphone/04.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="iPhone Files picker showing an extracted website folder next to its ZIP archive."></a>
<figcaption>4. Open the extracted folder next to the ZIP.</figcaption>
</figure>
<figure>
<a href="/help/cloudflare-iphone/05.jpg" aria-label="Open screenshot 5 at full size"><img src="/help/cloudflare-iphone/05.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Inside the website folder, index.html, script.js, and styles.css are visible below the Open button."></a>
<figcaption>5. Check the website files, then tap Open to upload this folder.</figcaption>
</figure>
</div>

## 4. Review the uploaded files

Back in Safari, check the file list. The example lists all three files directly: `index.html`, `script.js`, and `styles.css`. If the list is empty or shows the wrong folder's contents, correct the selection before deploying.

Cloudflare also supplies a **Worker name**. The tested example used `dry-band-0aa5`; your generated name will probably differ. Keep the supplied name or enter one you want to use.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/06.jpg" aria-label="Open screenshot 6 at full size"><img src="/help/cloudflare-iphone/06.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Cloudflare upload review lists index.html, script.js, and styles.css, with dry-band-0aa5 in the Worker name field."></a>
<figcaption>6. Confirm the file list and Worker name.</figcaption>
</figure>
</div>

## 5. Deploy the website

Tap **Deploy**. For this static test, the uploaded folder was enough: no terminal, editor, Git connection, Wrangler command, server-side runtime code, or build configuration was needed. Leave **Advanced settings** alone for this example.

Wait for Cloudflare to finish and show the application's overview. The screenshot below shows the final upload screen before tapping Deploy.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/07.jpg" aria-label="Open screenshot 7 at full size"><img src="/help/cloudflare-iphone/07.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="The completed static upload form with the blue Deploy button ready at the lower right."></a>
<figcaption>7. Tap Deploy when the uploaded files and name are correct.</figcaption>
</figure>
</div>

## 6. Open the live address

On the application's **Overview**, tap the address ending in `workers.dev`. That opens the deployed website. Its address follows the pattern `https://your-worker-name.your-subdomain.workers.dev`. Save this address so you can return to it and share your result. Open it in a private Safari tab while signed out to confirm someone else can reach it too.

A dashboard entry is only the deployment milestone. Open the website itself before deciding the build works.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/08.jpg" aria-label="Open screenshot 8 at full size"><img src="/help/cloudflare-iphone/08.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Cloudflare overview for dry-band-0aa5 with its clickable workers.dev address near the top."></a>
<figcaption>8. Open the workers.dev address from the overview.</figcaption>
</figure>
</div>

## 7. Check the page's controls

Try the main actions at the live address. In the tested example, **Say Hello** displayed **Hello from JavaScript!** and the status **Button click confirmed.** Moving the **Size** and **Radius** sliders changed the greeting's text size and the orange panel's rounded corners. Try **Reset** and confirm that it restores the starting state your agent described.

The two screenshots show the hello response and then the changed slider positions and appearance. Devin reported testing the controls on the deployed page. If your page looks different, check its controls against the behavior you asked your agent to build.

The example page's small heading says **Cloudflare Pages**, but its actual deployment in these screenshots used the Workers static-upload route described here.

<div class="help-screenshots">
<figure>
<a href="/help/cloudflare-iphone/09.jpg" aria-label="Open screenshot 9 at full size"><img src="/help/cloudflare-iphone/09.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="Deployed proof-of-concept page showing Button click confirmed, Size and Radius sliders, Say Hello and Reset buttons, and an orange Hello from JavaScript panel."></a>
<figcaption>9. Say Hello produces a visible JavaScript response on the live page.</figcaption>
</figure>
<figure>
<a href="/help/cloudflare-iphone/10.jpg" aria-label="Open screenshot 10 at full size"><img src="/help/cloudflare-iphone/10.jpg" width="588" height="1280" loading="lazy" decoding="async" alt="The same live page with both sliders near their maximum positions, larger greeting text, and more rounded orange panel corners."></a>
<figcaption>10. Move the sliders, compare the appearance, then check Reset.</figcaption>
</figure>
</div>

## Keep the result

The test served the HTML, external CSS, and external JavaScript as a working application. Say Hello changed the content, Reset restored the initial state, and both sliders changed the live interface. This established more than a successful file upload.

Keep the live address and the original website files with your Phase 1 progress. If a control fails, tell your agent what you tapped, what you expected, and what happened. Have it correct the files, upload the revised folder, and check the live result again.

## When to use this route

Use this for a tiny static project, a quick experiment, or learning how website files become a public app when you only have your phone. It is optional Phase 1 extra credit. Finish Phase 1 without deploying if you prefer.

For larger projects, source control and a normal development environment make ongoing work easier. This upload test does not cover server-side applications or replace [Phase 2's computer setup and meaningful build](/phases/2). Cloudflare's [static assets documentation](https://developers.cloudflare.com/workers/static-assets/) explains how it serves website files.
