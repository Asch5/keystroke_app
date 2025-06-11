PROMPTS:

Please write code following best practices for React 19 and Next.js 15.2.1-canary.5. Use Flowbite general style (not components) and include comments to explain your code.

TASK:

-
-
- Before answering, follow these steps:

Please write code following best practices for React 19 and Next.js 15.2.1-canary.5. Use Flowbite general style (not components) and include comments to explain your code.

1. **Explore the Latest Information**:

   - Research the latest documentation, updates, and best practices related to the topic.
   - Use the links provided in `.cursor/config.json` for React, Next.js, TypeScript, Prisma, and other tools in our stack.
   - If any documentation is missing or outdated, ask for clarification or updated links.

2. **Analyze the Codebase**:

   - Review the current codebase to understand the existing architecture, patterns, and state of the project.
   - Identify relevant files, components, and utilities that relate to the question.
   - Ensure your answer aligns with the current implementation and follows the rules defined in `.cursor/config.json`.

3. **Follow Rules and Best Practices**:

   - Adhere to the code quality rules, linting standards, and architectural constraints defined in `.cursor/config.json`.
   - Use TypeScript, enforce strict typing, and avoid banned patterns (e.g., `any`, non-null assertions).
   - Include JSDoc comments for all functions and components.

4. **Provide a Detailed Answer**:

   - Start with a brief explanation of the solution.
   - Include code snippets that are fully typed, documented, and follow best practices.
   - Highlight any potential pitfalls or considerations.

5. **Verify and Validate**:
   - Double-check your answer against the latest documentation and codebase.
   - Ensure all links, rules, and standards are respected.

Now, proceed with the question: [

question in the input window

]

==================================

Act as if you were a completely autonomous system. I will give you a document and you will only need to leave the necessary information from that document, which will be enough to fully understand what is contained in that document. The goal is to make this document shorter and easier for the autonomous system to follow in the future.@DESCRIPTION_OF_CORE_FOLDER.md

for styling:

Excellent. Creating a standardized prompt for this task is a highly effective way to ensure consistency and quality every single time. It acts as a formal "Definition of Done" for component styling and refactoring.

As requested, here is a comprehensive prompt template designed to be used for finetuning components according to our established rules. It is structured to be clear, actionable, and easy for an AI agent to process.

---

### **Prompt Template: Component Finetuning & Style Enhancement**

**Objective:**
Your task is to act as a senior front-end developer and perform a comprehensive review and refactoring of the component provided below. The goal is to elevate its code quality, styling, responsiveness, and performance to a production-ready standard, in strict accordance with our project's established rules.

---

**1. Target Component:**
`[ComponentName.tsx at /path/to/component]`

---

**2. Current Component Code:**

```tsx
[Paste the full, current code of the component here]
```

---

**3. Core Refactoring Checklist:**

You **must** address every item on this checklist.

- `[ ]` **Mobile-First Responsiveness:**

  - Refactor all styles to be **mobile-first**. The component must be pixel-perfect and functional on all breakpoints (mobile, tablet, desktop).
  - Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, etc.) to add or override styles for larger screens.
  - Validate layouts using `flexbox` and `grid` for fluidity.

- `[ ]` **Styling & Theming:**

  - Ensure all styling strictly uses **Tailwind CSS utility classes**.
  - Integrate variables from our `globals.css` theme where appropriate (e.g., colors, border-radius).
  - Remove any inline `style` objects or custom CSS classes unless absolutely necessary and documented with a `// HACK:` comment explaining why.

- `[ ]` **Component Structure & Readability (Rule 18):**

  - If the component is overly complex or exceeds ~300 lines, break it down into smaller, logical, and reusable sub-components.
  - Improve variable and function names to be clear and self-documenting.

- `[ ]` **Accessibility (A11y):**

  - Verify that all interactive elements are keyboard-navigable and have clear `focus-visible` states.
  - Add necessary ARIA attributes (`aria-label`, `role`, etc.) to improve the screen reader experience, especially for non-semantic or custom elements.
  - Ensure all images have meaningful `alt` props (`<Image alt="..." />`).

- `[ ]` **TypeScript & Prop Definition (Rule 8):**

  - The component's props interface must be clearly defined and strictly typed. Eliminate any use of `any`.
  - Add a comprehensive JSDoc block to the props interface, explaining each prop.

- `[ ]` **Performance Optimization (Rule 16):**

  - Wrap the component in `React.memo` if it is a pure component likely to re-render with the same props.
  - Memoize functions passed as props to child components using `useCallback`.
  - Ensure all images are rendered using the `next/image` component.

- `[ ]` **Documentation (Rule 5):**
  - Add a complete JSDoc block to the main component explaining its purpose, props, and an example usage if helpful.
  - Add inline comments (`//`) to clarify any complex calculations, workarounds, or business logic.

---

**4. Specific Instructions & Context:**
`[Optional: Add any specific requirements here. For example: "This button will be used in a high-contrast area, so ensure the focus ring is highly visible." or "The data for this card can sometimes be very long, so make sure text truncation with an ellipsis (...) is handled gracefully."]`

---

**5. Deliverables:**

1.  **Refactored Code:** Provide the complete, final code for the component (and any new sub-components you created).
2.  **Summary of Changes:** Briefly list the key improvements you made, referencing the checklist above. For example:
    - "Refactored to a mobile-first responsive layout."
    - "Extracted the `ListItem` into its own sub-component for reusability."
    - "Added `aria-label` to the close button for better accessibility."

Your final output should be production-ready code that I can merge with confidence.

a general prompt:

First of all read all DESCRIPTIONS and strictly follow Coursor's rules.
