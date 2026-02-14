import logo from '../images/DFR-Logo.webp'

export default function Topbar() {
    // console.log("LOGO RIGHT HERE!!!!!")
    console.log(logo.src);
    return <div style={{backgroundColor: 'lightgray',}}>
        <img src={logo.src} height={logo.height / 10} width={logo.width / 10}/>
    </div>
}