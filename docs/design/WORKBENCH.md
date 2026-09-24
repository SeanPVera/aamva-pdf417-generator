# Record workbench

Design decision, 24 September 2026, before implementation.

The product is an instrument for moving between a structured record and its machine-readable representation. Its organizing idea is a document on the left and a proof on the right: edit, inspect, then export. A thin numbered section index and fine dividing rules borrow the clarity of technical publications, without borrowing the appearance of a government credential. The barcode's dense horizontal geometry supplies the visual identity; no seals, plates, official colors, or decorative dashboard tiles.

1. **Typography:** retain the locally bundled Atkinson Hyperlegible Next for readable labels and values. JetBrains Mono is for element codes, payload bytes, and numerical accounting. Use a compact 12/14/16/22 px hierarchy, with tabular figures for counts.
2. **Color:** warm paper, near-black ink, and a restrained oxide red accent. Success, warning, and error have separate semantic colors and text labels. A dark palette preserves the same hierarchy; barcode paper stays white.
3. **Grid:** a compact horizontal record-context strip sits above two panes. Editing gets flexible space; output gets a bounded width. Fields use aligned two-column rows where space permits, then one column. Four-pixel spacing increments and 44 px controls keep density predictable and targets usable.
4. **Hierarchy:** product and document actions first; issuer/version/type second; record sections third. Within a section, human labels precede wire codes in visual importance. Output status precedes export actions. Diagnostics are selectable views, not an ever-growing stack.
5. **Components:** plain rectangular controls, small corner radii, thin rules, restrained selection fills. Solid accent identifies a primary action. Icons supplement short labels or identify genuinely spatial operations. Elevation is reserved for overlays.
6. **Interaction:** preserve input on failure, make repairs explicit, and keep imports atomic and undoable. Errors link to their field. Import offers paste, file, and scanner paths. Erasing a record also erases its undo history. No automatic tour interruption.
7. **Motion:** brief feedback only when content changes; honor reduced motion. No ambient animation, confetti, mascots, or credential imitation in the working interface.
8. **Product identity:** visible DL/ID context, numbered record sections, a white PDF417 proof, a raw/generated/source distinction, and byte-directory accounting make this specifically an AAMVA/PDF417 tool. The interface must never imply that a generated symbol is an officially issued or certified credential.

Validation: inspect actual desktop/mobile light/dark renders; check keyboard paths, imports, bad input, generation and export. Automated accessibility checks supplement, but do not replace, assistive-technology and physical-scanner review.
