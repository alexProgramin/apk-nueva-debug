export const AppLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 3V15.5C8 17.9853 10.0147 20 12.5 20C14.9853 20 17 17.9853 17 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 3H13C15.2091 3 17 4.79086 17 7C17 9.20914 15.2091 11 13 11H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 2.5L19 4L17.5 4.5L19 5L19.5 6.5L20 5L21.5 4.5L20 4L19.5 2.5Z"
        fill="hsl(var(--primary))"
      />
    </svg>
  );
  