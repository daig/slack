# Chat app builder

## Purpose
- Build a chat application based on slack
- Key features:
  - Channel-based messaging system
  - User authentication and session management
  - message updates
  - Join/leave channel functionality
  - Message composition
- Scope:
  - In scope: Core chat functionality, channel management, real-time updates
  - Out of scope: File sharing, direct messages, rich text formatting

## Experts
### React and TypeScript
- Who: React core team and TypeScript maintainers
- Focus: Building scalable web applications with React and TypeScript
- Why Follow: Best practices for type-safe React components and hooks
- Where: React docs, TypeScript handbook, component patterns

### Apollo GraphQL
- Who: Apollo GraphQL team
- Focus: GraphQL client implementation and data management
- Why Follow: Efficient real-time data fetching and caching strategies
- Where: Apollo Client docs, query/mutation patterns

### Tailwind CSS
- Who: Tailwind Labs team
- Focus: Utility-first CSS framework
- Why Follow: Modern responsive UI design patterns
- Where: Tailwind CSS docs, component examples

### Electron
- Who: GitHub/Electron team
- Focus: Cross-platform desktop applications
- Why Follow: Desktop integration best practices
- Where: Electron documentation, IPC patterns

## SpikyPOVs
### Truths
- Tailwind's utility-first approach leads to more maintainable UI code than traditional CSS/SCSS
- Network-first updates with loading states provide a clean, reliable UX for chat apps while keeping the codebase simple and maintainable
- TypeScript interfaces are preferable to types for component props - they're more extensible and readable
- GraphQL's declarative data fetching and real-time subscriptions make it superior to REST for chat applications, reducing over-fetching and simplifying state management

### Myths
- Complex state management (Redux etc.) is needed for chat apps
- Electron apps need complex IPC setups - many chat features can work entirely in the renderer process
- Supabase is the best choice for web apps because it is most visible

## Knowledge Tree
### Technical Architecture
#### Summary
- Frontend: React + TypeScript + Tailwind CSS
- API Layer: GraphQL with Apollo Client
- Desktop Integration: Electron
- Key architectural decisions and their rationales

#### Sources
##### React Official Documentation
- Summary: Best practices for hooks, functional components, and TypeScript integration that informed our component architecture
- Link: https://react.dev/learn/typescript
- Insights: The new React docs strongly advocate for TypeScript and custom hooks pattern we adopted

##### Apollo Client Documentation
- Summary: Implementation patterns for queries, mutations, and caching strategies in React applications
- Link: https://www.apollographql.com/docs/react/
- Insights: Their polling approach is recommended over subscriptions for many real-time use cases

##### Tailwind CSS Documentation
- Summary: Utility-first CSS framework patterns and component examples
- Link: https://tailwindcss.com/docs
- Insights: Their spacing and color system conventions create consistent, maintainable UIs

##### Electron Documentation
- Summary: Architecture patterns and security considerations for desktop apps
- Link: https://www.electronjs.org/docs/latest/
- Insights: Their security guidelines recommend minimizing IPC usage where possible

##### Kent C. Dodds Blog
- Summary: Custom hooks patterns and React component design principles
- Link: https://kentcdodds.com/blog/application-state-management-with-react
- Insights: His approach to state management without Redux influenced our simpler architecture

##### PostGraphile Documentation
- Summary: Auto-generated GraphQL API patterns and PostgreSQL integration best practices
- Link: https://www.graphile.org/postgraphile/introduction/
- Insights: Their approach to schema design and real-time functionality shaped our database architecture
