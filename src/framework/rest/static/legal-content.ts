/**
 * Built-in legal page content — served whenever the admin hasn't saved a
 * custom body in Settings → Storefront → Legal Pages
 * (settings.options.legalPages.{privacy|terms}.body). Provided by the owner
 * 2026-08-29 (Silvestrix Green LLP); contact details per owner instruction.
 */

export type LegalDoc = { title: string; updatedAt: string; body: string };

const CONTACT_HTML = `
<p><strong>PlantAtHome</strong><br/>Operated by <strong>Silvestrix Green LLP</strong></p>
<p><strong>Email:</strong> <a href="mailto:support@plantathome.in">support@plantathome.in</a><br/>
<strong>Phone:</strong> <a href="tel:+919996715655">+91 99967 15655</a></p>`;

const PRIVACY_HTML = `
<p>Welcome to <strong>PlantAtHome</strong>.</p>
<p>PlantAtHome is operated by <strong>Silvestrix Green LLP</strong> ("PlantAtHome", "Silvestrix Green LLP", "we", "us", or "our").</p>
<p>Your privacy is important to us. This Privacy Policy explains how we collect, use, store, share, and protect your information when you visit our website, purchase our products, use our services, or communicate with us through WhatsApp and other communication channels.</p>
<p>By using our website or services, you agree to the practices described in this Privacy Policy.</p>

<h2>1. Information We Collect</h2>
<h3>Personal Information</h3>
<p>When you visit our website, place an order, create an account, contact us, or use our services, we may collect:</p>
<ul><li>Full name</li><li>Mobile phone number</li><li>Email address</li><li>Delivery address</li><li>Billing address</li><li>Order and transaction details</li><li>Account information</li><li>Customer support communications</li></ul>
<h3>WhatsApp Communications</h3>
<p>If you contact or communicate with PlantAtHome through WhatsApp, we may collect and process information related to your interaction with us, including:</p>
<ul><li>Your WhatsApp phone number</li><li>Your name, where available</li><li>Messages you send to us</li><li>Information you voluntarily provide during conversations</li><li>Order, delivery, payment, or support-related information</li></ul>
<p>We use this information to respond to your requests, provide customer support, process orders, send relevant service communications, and improve our services.</p>
<p>PlantAtHome may use the WhatsApp Business Platform and services provided by Meta or authorized service providers to communicate with customers.</p>
<h3>Automatically Collected Information</h3>
<p>When you visit our website, certain technical information may be collected automatically, including:</p>
<ul><li>IP address</li><li>Browser type</li><li>Device information</li><li>Operating system</li><li>Pages visited</li><li>Date and time of visits</li><li>Website usage information</li></ul>
<p>This information may be used to improve website functionality, security, performance, and user experience.</p>

<h2>2. How We Use Your Information</h2>
<p>We may use your information to:</p>
<ul><li>Provide and operate our services</li><li>Process and manage orders</li><li>Arrange delivery of products</li><li>Process payments through authorized payment providers</li><li>Communicate regarding orders and purchases</li><li>Provide customer support</li><li>Respond to questions and requests</li><li>Send transactional and service-related notifications</li><li>Send promotional or marketing communications where permitted by applicable law and where appropriate consent has been obtained</li><li>Improve our products, services, website, and customer experience</li><li>Prevent fraud, abuse, and unauthorized activities</li><li>Maintain the security of our systems</li><li>Comply with legal and regulatory obligations</li></ul>

<h2>3. WhatsApp Communications and Consent</h2>
<p>PlantAtHome may communicate with customers using the WhatsApp Business Platform.</p>
<p>By voluntarily providing your WhatsApp number, initiating communication with us through WhatsApp, or otherwise providing the required consent where applicable, you may receive relevant communications from PlantAtHome, including:</p>
<ul><li>Order confirmations</li><li>Payment-related updates</li><li>Delivery and shipping updates</li><li>Customer support communications</li><li>Service notifications</li><li>Appointment or order-related updates</li><li>Other transactional communications</li></ul>
<p>Promotional or marketing messages will only be sent in accordance with applicable laws, platform policies, and consent requirements.</p>
<p>You may opt out of promotional communications at any time by following the instructions provided in the message or by contacting us.</p>
<p>Opting out of promotional messages may not prevent us from sending important transactional or service-related communications where necessary.</p>

<h2>4. How We Share Your Information</h2>
<p><strong>We do not sell your personal information.</strong></p>
<p>We may share your information with trusted third parties when reasonably necessary to provide our services, including:</p>
<ul><li>Delivery and logistics partners</li><li>Payment service providers</li><li>Website hosting and technology providers</li><li>Customer support providers</li><li>WhatsApp Business Platform service providers</li><li>Analytics and security service providers</li><li>Government authorities, regulators, or law enforcement agencies where required by applicable law</li></ul>
<p>We take reasonable steps to ensure that third-party service providers handle personal information appropriately and only for legitimate purposes related to the services they provide.</p>

<h2>5. Payments</h2>
<p>Payments may be processed through third-party payment service providers.</p>
<p>PlantAtHome does not intentionally store complete debit card, credit card, or other sensitive payment information unless specifically required and permitted by applicable law.</p>
<p>Payment service providers process payment information according to their own terms, privacy policies, and security practices.</p>

<h2>6. Data Security</h2>
<p>We take reasonable technical, organizational, and administrative measures to protect your personal information against:</p>
<ul><li>Unauthorized access</li><li>Loss</li><li>Misuse</li><li>Alteration</li><li>Disclosure</li><li>Destruction</li></ul>
<p>However, no method of transmitting information over the internet or storing information electronically is completely secure.</p>
<p>While we take reasonable measures to protect your information, we cannot guarantee absolute security.</p>

<h2>7. Data Retention</h2>
<p>We retain personal information only for as long as reasonably necessary to:</p>
<ul><li>Provide our products and services</li><li>Process and complete transactions</li><li>Provide customer support</li><li>Meet legal and regulatory requirements</li><li>Resolve disputes</li><li>Prevent fraud and abuse</li><li>Enforce our agreements</li></ul>
<p>When information is no longer required, we may securely delete, anonymize, or archive it in accordance with applicable laws and business requirements.</p>

<h2>8. Your Rights and Choices</h2>
<p>Depending on applicable law, you may have the right to:</p>
<ul><li>Request access to your personal information</li><li>Request correction of inaccurate or incomplete information</li><li>Request deletion of your personal information, subject to applicable legal requirements</li><li>Withdraw consent where processing is based on consent</li><li>Opt out of promotional communications</li><li>Ask questions about how your information is collected or used</li></ul>
<p>To make a request regarding your information, please contact us using the contact details provided below.</p>

<h2>9. Cookies and Similar Technologies</h2>
<p>Our website may use cookies and similar technologies to:</p>
<ul><li>Improve website functionality</li><li>Remember user preferences</li><li>Understand website usage</li><li>Improve performance</li><li>Maintain security</li></ul>
<p>You may manage or disable cookies through your browser settings.</p>
<p>Please note that disabling certain cookies may affect the functionality or availability of certain parts of our website.</p>

<h2>10. Third-Party Services and Links</h2>
<p>Our website and services may contain links to third-party websites or use services provided by third parties.</p>
<p>PlantAtHome is not responsible for the privacy practices, content, security, or policies of third-party websites or services.</p>
<p>We encourage users to review the privacy policies of third-party services before providing personal information.</p>

<h2>11. Children's Privacy</h2>
<p>Our services are not intentionally directed toward children in violation of applicable laws.</p>
<p>We do not knowingly collect personal information from children where parental consent or other authorization is required by law.</p>
<p>If you believe that a child has provided personal information to us without appropriate authorization, please contact us so that we can take appropriate action.</p>

<h2>12. Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time.</p>
<p>Any changes will be posted on this page, and the <strong>Last Updated</strong> date will be revised accordingly.</p>
<p>We encourage you to review this Privacy Policy periodically to stay informed about how we handle your information.</p>

<h2>13. Contact Us</h2>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:</p>
${CONTACT_HTML}
<p>By using PlantAtHome's website, products, services, or communication channels, you acknowledge that you have read and understood this Privacy Policy.</p>`;

const TERMS_HTML = `
<p>Welcome to <strong>PlantAtHome</strong>.</p>
<p>PlantAtHome is operated by <strong>Silvestrix Green LLP</strong> ("PlantAtHome", "Silvestrix Green LLP", "we", "us", or "our").</p>
<p>These Terms of Service ("Terms") govern your access to and use of the PlantAtHome website, products, services, and communication channels, including communications through the WhatsApp Business Platform.</p>
<p>By accessing our website, placing an order, using our services, or communicating with us, you agree to these Terms.</p>
<p>If you do not agree with these Terms, please do not use our website or services.</p>

<h2>1. Our Services</h2>
<p>PlantAtHome provides products and services related to plants, gardening, home greenery, and other products or services offered through our website and authorized communication channels.</p>
<p>The availability of products and services may vary depending on:</p>
<ul><li>Location</li><li>Inventory</li><li>Operational capacity</li><li>Delivery availability</li><li>Other relevant factors</li></ul>
<p>We reserve the right to modify, suspend, or discontinue products or services where reasonably necessary and subject to applicable law.</p>

<h2>2. Eligibility</h2>
<p>By using our services, you represent that:</p>
<ul><li>You are legally capable of entering into a binding agreement under applicable law.</li><li>The information you provide is accurate and complete.</li><li>You will use our services only for lawful purposes.</li></ul>
<p>If you use our services on behalf of an organization, you represent that you have the authority to accept these Terms on behalf of that organization.</p>

<h2>3. Orders</h2>
<p>When you place an order with PlantAtHome:</p>
<ul><li>All orders are subject to product availability.</li><li>Orders may be subject to verification or confirmation.</li><li>We may refuse, cancel, or limit an order where reasonably necessary or permitted by applicable law.</li><li>Product images are for illustrative purposes and the actual product may vary.</li><li>Plants and natural products may vary in size, color, shape, growth, and appearance.</li><li>Prices and availability may change from time to time.</li></ul>
<p>An order confirmation does not necessarily constitute final acceptance of an order where additional verification, payment confirmation, or processing is required.</p>

<h2>4. Product Information</h2>
<p>We make reasonable efforts to ensure that product descriptions and information are accurate.</p>
<p>However, due to the natural characteristics of plants and other products, we do not guarantee that:</p>
<ul><li>Every product will look exactly identical to the product image.</li><li>Plants will have identical size, shape, color, or growth patterns.</li><li>Product information will always be completely free from errors.</li></ul>
<p>Plants are living products and natural variations are expected.</p>
<p>Proper care after delivery is important for maintaining the health and longevity of plants.</p>

<h2>5. Pricing and Payments</h2>
<p>Prices displayed on PlantAtHome may change from time to time.</p>
<p>Applicable taxes, delivery charges, or other fees may be added where applicable and displayed during the purchase process.</p>
<p>Payments must be completed through the payment methods made available by PlantAtHome or its authorized payment partners.</p>
<p>We may cancel or refuse a transaction where we reasonably suspect:</p>
<ul><li>Fraud</li><li>Unauthorized activity</li><li>Incorrect pricing</li><li>Technical errors</li><li>Payment issues</li></ul>
<p>Where required, appropriate refunds will be processed in accordance with applicable law and our relevant refund policies.</p>

<h2>6. Delivery</h2>
<p>Delivery timelines may vary depending on:</p>
<ul><li>Delivery location</li><li>Product availability</li><li>Weather conditions</li><li>Logistics operations</li><li>Public holidays</li><li>Other circumstances beyond our reasonable control</li></ul>
<p>While we aim to deliver orders within the estimated timeframe, delivery dates and times may not always be guaranteed.</p>
<p>Customers are responsible for providing accurate delivery information.</p>
<p>PlantAtHome may contact customers through phone calls, SMS, WhatsApp, email, or other available communication methods regarding their orders or deliveries.</p>

<h2>7. Cancellation, Returns, Replacements, and Refunds</h2>
<p>Cancellation, return, replacement, and refund requests are subject to the applicable PlantAtHome policies and applicable law.</p>
<p>Certain products, including live plants and other perishable or sensitive products, may be subject to special return or replacement conditions.</p>
<p>If a product arrives damaged, defective, or materially different from the order, customers should contact us within the applicable reporting period and provide relevant information or evidence where reasonably required.</p>
<p>Approved refunds will generally be processed through the original payment method or another appropriate method, subject to applicable payment provider policies.</p>

<h2>8. WhatsApp Communications</h2>
<p>PlantAtHome may use the WhatsApp Business Platform to communicate with customers.</p>
<p>By initiating communication with us through WhatsApp, voluntarily providing your WhatsApp number, or providing applicable consent, you may receive messages relating to:</p>
<ul><li>Orders</li><li>Payments</li><li>Deliveries</li><li>Customer support</li><li>Account or service updates</li><li>Other relevant transactional communications</li></ul>
<p>Promotional or marketing communications will be sent in accordance with applicable laws, platform policies, and consent requirements.</p>
<p>You may opt out of promotional communications by following the instructions provided or by contacting us.</p>
<p>WhatsApp and related services may also be subject to the terms and policies of their respective service providers.</p>

<h2>9. Acceptable Use</h2>
<p>You agree not to:</p>
<ul><li>Use our website or services for unlawful purposes</li><li>Provide false or misleading information</li><li>Interfere with the operation or security of our systems</li><li>Attempt unauthorized access to our systems or accounts</li><li>Use automated systems to improperly access or collect information</li><li>Impersonate another person or organization</li><li>Engage in fraudulent, abusive, or harmful conduct</li><li>Violate applicable laws or regulations</li></ul>
<p>We may suspend or restrict access where we reasonably believe these Terms have been violated.</p>

<h2>10. Intellectual Property</h2>
<p>Unless otherwise stated, the content available through PlantAtHome, including:</p>
<ul><li>Logos</li><li>Brand names</li><li>Website content</li><li>Graphics</li><li>Designs</li><li>Text</li><li>Images</li><li>Product information</li></ul>
<p>is owned by or licensed to <strong>Silvestrix Green LLP</strong> and is protected by applicable intellectual property laws.</p>
<p>You may not copy, reproduce, distribute, modify, or use our intellectual property without prior written permission, except where permitted by applicable law.</p>

<h2>11. Third-Party Services</h2>
<p>PlantAtHome may rely on third-party providers for services including:</p>
<ul><li>Payment processing</li><li>Delivery and logistics</li><li>Website hosting</li><li>Communication platforms</li><li>Analytics</li><li>Technology and security services</li></ul>
<p>Your use of certain third-party services may also be subject to their respective terms and privacy policies.</p>
<p>PlantAtHome is not responsible for the independent services, availability, or policies of third-party providers.</p>

<h2>12. Disclaimer</h2>
<p>To the maximum extent permitted by applicable law, PlantAtHome provides its website and services on an <strong>"as available"</strong> basis.</p>
<p>We make reasonable efforts to provide accurate and reliable services but do not guarantee that:</p>
<ul><li>The website will always be available or error-free</li><li>All information will always be completely accurate</li><li>Services will always operate without interruption</li></ul>
<p>Nothing in these Terms excludes any rights that cannot legally be excluded under applicable law.</p>

<h2>13. Limitation of Liability</h2>
<p>To the maximum extent permitted by applicable law, PlantAtHome and Silvestrix Green LLP shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from the use of our website, products, or services.</p>
<p>Nothing in these Terms limits or excludes liability where such limitation or exclusion is prohibited by applicable law.</p>

<h2>14. Indemnification</h2>
<p>To the extent permitted by applicable law, you agree to indemnify and hold harmless PlantAtHome, Silvestrix Green LLP, its partners, employees, affiliates, and service providers from claims, losses, damages, liabilities, and expenses arising from:</p>
<ul><li>Your violation of these Terms</li><li>Your misuse of our services</li><li>Your violation of applicable laws</li><li>Your violation of the rights of another person</li></ul>

<h2>15. Suspension or Termination</h2>
<p>We may suspend, restrict, or terminate access to our services where reasonably necessary, including where:</p>
<ul><li>You violate these Terms</li><li>Fraudulent or unauthorized activity is suspected</li><li>We are required to do so by law</li><li>It is necessary to protect our systems, customers, or business</li></ul>
<p>Termination does not affect rights or obligations that arose before termination.</p>

<h2>16. Changes to These Terms</h2>
<p>We may update these Terms from time to time.</p>
<p>Updated Terms will be posted on this page with a revised <strong>Last Updated</strong> date.</p>
<p>Your continued use of our website or services after updated Terms become effective constitutes acceptance of the revised Terms to the extent permitted by applicable law.</p>

<h2>17. Governing Law and Jurisdiction</h2>
<p>These Terms shall be governed by and interpreted in accordance with the laws of <strong>India</strong>.</p>
<p>Any disputes shall be subject to the jurisdiction of the competent courts as determined under applicable law.</p>

<h2>18. Contact Us</h2>
<p>If you have any questions regarding these Terms of Service, please contact us:</p>
${CONTACT_HTML}
<p>By accessing or using PlantAtHome's website, products, services, or communication channels, you acknowledge that you have read, understood, and agreed to these Terms of Service.</p>`;

const DATA_DELETION_HTML = `
<p>PlantAtHome is operated by <strong>Silvestrix Green LLP</strong>.</p>
<p>We respect your right to request the deletion of your personal information. This page explains how you can request the deletion of data associated with your use of PlantAtHome's website, products, services, and communication channels, including WhatsApp.</p>

<h2>How to Request Data Deletion</h2>
<p>If you would like PlantAtHome to delete your personal information, you may submit a data deletion request using the following method:</p>
<h3>Submit a Request by Email</h3>
<p>Send an email to: <strong><a href="mailto:data@plantathome.in">data@plantathome.in</a></strong></p>
<p>Use the subject line: <strong>Data Deletion Request</strong></p>
<p>Please include the following information:</p>
<ul><li>Your full name</li><li>Your registered mobile or WhatsApp number</li><li>Your email address, if applicable</li><li>Any other information that may help us identify your account or records</li></ul>
<p>We may request additional information to verify your identity before processing your request.</p>

<h2>What Data May Be Deleted</h2>
<p>Upon receiving and verifying a valid request, we will take reasonable steps to delete or anonymize applicable personal information associated with you, which may include:</p>
<ul><li>Name</li><li>Phone number</li><li>WhatsApp-related contact information</li><li>Email address</li><li>Account information</li><li>Customer support records</li><li>Other personal information that is no longer required to be retained</li></ul>

<h2>Information We May Need to Retain</h2>
<p>In certain circumstances, we may be required or permitted to retain some information for legitimate purposes, including:</p>
<ul><li>Compliance with applicable laws and regulations</li><li>Tax and accounting requirements</li><li>Fraud prevention and security</li><li>Resolution of disputes</li><li>Enforcement of legal agreements</li></ul>
<p>Where information must be retained, it will be kept only for as long as necessary for the relevant legal or legitimate purpose.</p>

<h2>WhatsApp Data</h2>
<p>If you have communicated with PlantAtHome through WhatsApp, you may request the deletion of personal information held by PlantAtHome in connection with those communications.</p>
<p>Please note that the deletion of information held by PlantAtHome does not necessarily delete information independently retained by WhatsApp, Meta, or other third-party service providers. Such information may be governed by the respective privacy policies and data management procedures of those providers.</p>

<h2>Request Processing</h2>
<p>After receiving your request:</p>
<ul><li>We may verify your identity.</li><li>We will review your request.</li><li>We will process the deletion of applicable information where required or appropriate.</li><li>We may notify you once your request has been processed.</li></ul>
<p>We aim to process valid requests within a reasonable timeframe, subject to applicable legal requirements and operational requirements.</p>

<h2>Contact Us</h2>
<p>For questions or requests related to the deletion of your personal information, please contact:</p>
<p><strong>PlantAtHome</strong><br/>Operated by <strong>Silvestrix Green LLP</strong></p>
<p><strong>Email:</strong> <a href="mailto:data@plantathome.in">data@plantathome.in</a></p>

<h2>Important Information</h2>
<p>Submitting a data deletion request may affect your ability to use certain PlantAtHome services in the future.</p>
<p>This page should be read together with our <a href="/privacy"><strong>Privacy Policy</strong></a> and <a href="/terms"><strong>Terms of Service</strong></a>.</p>`;

export const LEGAL_DEFAULTS: Record<'privacy' | 'terms' | 'dataDeletion', LegalDoc> = {
  privacy: { title: 'Privacy Policy', updatedAt: 'August 29, 2026', body: PRIVACY_HTML },
  terms: { title: 'Terms of Service', updatedAt: 'August 29, 2026', body: TERMS_HTML },
  dataDeletion: { title: 'Data Deletion Instructions', updatedAt: 'August 29, 2026', body: DATA_DELETION_HTML },
};
