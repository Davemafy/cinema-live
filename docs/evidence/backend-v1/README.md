# Actual two-variable HTTPS connection verification

This is real local CPU inference, not a mocked render and not a public GPU run.
The same Next application used CINEMA_BACKEND_URL and CINEMA_BACKEND_TOKEN with
an explicitly permitted development HTTPS origin. TLS termination forwarded the
existing FastAPI contract without replacing media or models. Node trusted the
generated local CA; Chromium narrowly trusted only that certificate's public-key
fingerprint. General TLS verification was not disabled.

Actual uploaded source SHA256 aff5cc...ec96, different first frame from the five-
second showcase. A new IC-Light reference ran 19 denoise steps in its fresh job
folder. Measured CPU: 216.733 s image inference, 235.684 s load + inference,
284.128 s whole processing, 3.776 GiB peak RAM. The actual 48-frame 854x480 MP4
preserves 24000/1001 fps; both source/result browser videos completed at 2.002 s,
with no media/page errors and no 390px viewport overflow.

Downloaded through the authenticated app's export flow, validating exact origin,
job identity and worker HMAC. Its SHA256 is
c28dd4ffa390f193426e55cdc69cbbb915ad0bb8994f8e5736f72735c81ebec4,
matching the preserved actual film at
../subject-aware-v1/fresh-upload-download.mp4.

Separately, both rendering adapters passed mocked protocol checks on Cloudflare,
Modal-style and arbitrary HTTPS/custom-port origins, including auth, every state,
invalid origins, tampered/expired signatures, failures, unavailable workers,
independent app-key stability and refusal to migrate old jobs to a new origin.
Mocks prove connection behavior, not GPU fit. Actual GPU execution and public
activation are not claimed. Production was not changed.
