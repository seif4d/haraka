export default function BrandLogo({inverse=false}:{inverse?:boolean}) {
  return <img className="brand-logo" src={inverse?"/brand/harka-logo-inverse.svg":"/brand/harka-logo.svg"} alt="حركة — Learn in motion" width={264} height={112}/>;
}
