import { SVGProps } from 'react';

function ZodLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="256px"
      height="203px"
      viewBox="0 0 256 203"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <defs>
        <path
          d="M200.42 0H53.63L0 53.355l121.76 146.624 9.714-10.9L252 53.857 200.42 0zm-5.362 12.562l39.84 41.6-112.8 126.558L17 54.162l41.815-41.6h136.243z"
          id="b"
        />
        <filter x="-2.2%" y="-2.8%" width="105.2%" height="106.5%" filterUnits="objectBoundingBox" id="a">
          <feOffset dx={1} dy={1} in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur stdDeviation={2} in="shadowOffsetOuter1" result="shadowBlurOuter1" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.36 0" in="shadowBlurOuter1" />
        </filter>
      </defs>
      <g transform="translate(2 1.51)">
        <path
          fill="#18253F"
          d="M58.8162023 12.5220497L195.093896 12.5220497 235.027464 54.2130202 122.038097 180.765999 16.9574282 54.2130202z"
        />
        <path
          fill="#274D82"
          d="M149.426831 150.874561L96.0134271 150.874561 71.8889656 121.341138 140.252621 121.33896 140.255033 117.149462 179.332589 117.149462z"
        />
        <path
          fill="#274D82"
          d="M223.55992 42.3226943L76.1782017 127.413686 56.9521852 103.361957 171.050895 37.4849931 168.955265 33.853745 199.34598 16.3076536z"
        />
        <path
          fill="#274D82"
          d="M144.596212 12.5642823L33.9304463 76.4571406 16.7194669 54.9715457 90.8141008 12.1929865z"
        />
        <use filter="url(#a)" xlinkHref="#b" />
        <use fill="#3068B7" xlinkHref="#b" />
      </g>
    </svg>
  );
}

export default ZodLogo;
