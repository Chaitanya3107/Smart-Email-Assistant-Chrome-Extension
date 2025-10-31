// ======================================================================
//  📧 Gmail AI Email Writer - Content Script
//  This script runs inside Gmail’s web page and watches for when a user
//  opens the “Compose” window. When detected, it automatically injects
//  an “AI Reply” button that calls a backend API to generate email replies.
// ======================================================================


// --- Just a log to confirm the script has been loaded ---
console.log("✅ Email Writer Extension - Content Script Loaded");


// ======================================================================
//  🔍 Function: findComposeToolbar()
//  Purpose: Locate Gmail’s toolbar area (where buttons like “Send” appear)
//  Returns: The toolbar element if found, otherwise null.
// ======================================================================
function findComposeToolbar() {

    // These are possible CSS selectors where Gmail’s toolbar may exist.
    // Gmail uses dynamic class names that may change, so we check multiple.
    const selectors = ['.btc', '.aDh', '[role="toolbar"]', '.gU.Up'];

    // Loop through each selector and check if it exists in the DOM
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            // If found, return it
            return toolbar;
        }
    }

    // If no toolbar matches any selector, return null
    return null;
}



// ======================================================================
//  📝 Function: getEmailContent()
//  Purpose: Extract the current email’s body text (to send to the AI API)
//  Returns: The email text as a string.
// ======================================================================
function getEmailContent() {

    // Possible selectors where Gmail stores the email content.
    const selectors = ['.h7', '.a3s.aiL', 'gmail_quote', '[role="presentation"]'];

    // Loop through and return the inner text of the first element found
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            // Trim removes leading/trailing whitespace
            return content.innerText.trim();
        }
    }

    // If no content found, return an empty string
    return '';
}



// ======================================================================
//  🔘 Function: createAIButton()
//  Purpose: Create the "AI Reply" button with Gmail-like styling.
//  Returns: A <div> element styled as a button.
// ======================================================================
function createAIButton() {

    // Create a <div> which Gmail uses for buttons
    const button = document.createElement('div');

    // Add Gmail’s button CSS classes for consistent look
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button';

     // Apply styles to make alignment perfect
    button.style.marginLeft = '8px';       // Space from Send button
    button.style.display = 'inline-flex';  // Keep in one line with Send button
    button.style.alignItems = 'center';    // Vertical centering
    button.style.height = '36px';          // Match Gmail button height
    button.style.lineHeight = '36px';      // Center text vertically
    button.style.cursor = 'pointer';       // Hand cursor

    // Button text
    button.innerHTML = 'AI Reply';

    // Accessibility attributes
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');

    // Return the newly created button
    return button;
}



// ======================================================================
//  🧩 Function: injectButton()
//  Purpose: Find the Gmail toolbar and inject our custom “AI Reply” button.
// ======================================================================
function injectButton() {

    // If the button already exists (from previous detection), remove it first.
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    // Try to find Gmail’s compose toolbar
    const toolbar = findComposeToolbar();

    // If toolbar not found, exit early
    if (!toolbar) {
        console.log("❌ Toolbar not found, skipping injection");
        return;
    }

    console.log("✅ Toolbar found, injecting AI Reply button");

    // Create the AI Reply button
    const button = createAIButton();

    // Add the click event listener for generating AI-based replies
    button.addEventListener('click', async () => {

        try {
            // Update button UI to show loading state
            button.innerHTML = 'Generating...';
            button.disabled = true;

            // Get the currently visible email’s text
            const emailContent = getEmailContent();

            // Make a POST request to your backend API
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: "professional"
                })
            });

            // If the API fails (e.g., server error), throw an error
            if (!response.ok) throw new Error('API Request Failed');

            // Read the text response (the AI-generated email reply)
            const generatedReply = await response.text();

            // Find Gmail’s message typing area (compose box)
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox) {
                // Focus the compose box
                composeBox.focus();

                // Insert the AI-generated reply text
                // Note: execCommand is deprecated, but works with Gmail
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('❌ Compose Box not found');
            }

        } catch (error) {
            // Log and alert on any API or DOM failure
            console.error(error);
            alert('⚠️ Failed to generate AI reply');
        } finally {
            // Always reset the button state
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    // Insert the new button into the toolbar (at the beginning)
    toolbar.insertBefore(button, toolbar.firstChild);
}



// ======================================================================
//  👀 MutationObserver Setup
//  Purpose: Detect when the Gmail “Compose” window opens.
//  Gmail is a Single Page App (SPA), so DOM changes happen dynamically.
//  MutationObserver lets us watch for when new elements are added.
// ======================================================================
const observer = new MutationObserver((mutations) => {

    // Loop through each detected mutation (change in DOM)
    for (const mutation of mutations) {

        // Collect all new nodes added to the DOM in this mutation
        const addedNodes = Array.from(mutation.addedNodes);

        // Check if any of these nodes represent a Gmail compose window
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (
                node.matches('.aDh, .btc, [role="dialog"]') ||
                node.querySelector('.aDh, .btc, [role="dialog"]')
            )
        );

        // If we detect the compose window being created...
        if (hasComposeElements) {
            console.log("🪄 Compose Window Detected");

            // Wait 500ms (to ensure DOM finishes rendering), then inject the button
            setTimeout(injectButton, 500);
        }
    }
});



// ======================================================================
//  🚀 Start Observing the Page
//  We tell the MutationObserver to watch the whole page body for new nodes.
//  - childList: true → watch for added/removed elements
//  - subtree: true → also watch inside nested elements
// ======================================================================
observer.observe(document.body, {
    childList: true,
    subtree: true
});
