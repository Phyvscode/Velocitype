export interface FontOption {
  name: string;
  category: 'Sans-Serif' | 'Monospace' | 'Serif' | 'Display';
  googleFont: string;
}

export const PRESET_FONTS: FontOption[] = [
  { name: 'ABeeZee', category: 'Sans-Serif', googleFont: 'ABeeZee' },
  { name: 'ADLaM Display', category: 'Display', googleFont: 'ADLaM+Display' },
  { name: 'AR One Sans', category: 'Sans-Serif', googleFont: 'AR+One+Sans' },
  { name: 'Abel', category: 'Sans-Serif', googleFont: 'Abel' },
  { name: 'Abhaya Libre', category: 'Serif', googleFont: 'Abhaya+Libre' },
  { name: 'Aboreto', category: 'Display', googleFont: 'Aboreto' },
  { name: 'Abril Fatface', category: 'Display', googleFont: 'Abril+Fatface' },
  { name: 'Abyssinica SIL', category: 'Serif', googleFont: 'Abyssinica+SIL' },
  { name: 'Aclonica', category: 'Sans-Serif', googleFont: 'Aclonica' },
  { name: 'Acme', category: 'Sans-Serif', googleFont: 'Acme' },
  { name: 'Actor', category: 'Sans-Serif', googleFont: 'Actor' },
  { name: 'Adamina', category: 'Serif', googleFont: 'Adamina' },
  { name: 'Advent Pro', category: 'Sans-Serif', googleFont: 'Advent+Pro' },
  { name: 'Agdasima', category: 'Sans-Serif', googleFont: 'Agdasima' },
  { name: 'Aguafina Script', category: 'Display', googleFont: 'Aguafina+Script' },
  { name: 'Akatab', category: 'Sans-Serif', googleFont: 'Akatab' },
  { name: 'Akaya Kanadaka', category: 'Display', googleFont: 'Akaya+Kanadaka' },
  { name: 'Akaya Telivigala', category: 'Display', googleFont: 'Akaya+Telivigala' },
  { name: 'Akronim', category: 'Display', googleFont: 'Akronim' },
  { name: 'Akshar', category: 'Sans-Serif', googleFont: 'Akshar' },
  { name: 'Aladin', category: 'Display', googleFont: 'Aladin' },
  { name: 'Alata', category: 'Sans-Serif', googleFont: 'Alata' },
  { name: 'Alatsi', category: 'Sans-Serif', googleFont: 'Alatsi' },
  { name: 'Albert Sans', category: 'Sans-Serif', googleFont: 'Albert+Sans' },
  { name: 'Aldrich', category: 'Sans-Serif', googleFont: 'Aldrich' },
  { name: 'Alef', category: 'Sans-Serif', googleFont: 'Alef' },
  { name: 'Alegreya', category: 'Serif', googleFont: 'Alegreya' },
  { name: 'Alegreya SC', category: 'Serif', googleFont: 'Alegreya+SC' },
  { name: 'Alegreya Sans', category: 'Sans-Serif', googleFont: 'Alegreya+Sans' },
  { name: 'Alegreya Sans SC', category: 'Sans-Serif', googleFont: 'Alegreya+Sans+SC' },
  { name: 'Aleo', category: 'Serif', googleFont: 'Aleo' },
  { name: 'Alex Brush', category: 'Display', googleFont: 'Alex+Brush' },
  { name: 'Alexandria', category: 'Sans-Serif', googleFont: 'Alexandria' },
  { name: 'Alfa Slab One', category: 'Display', googleFont: 'Alfa+Slab+One' },
  { name: 'Alice', category: 'Serif', googleFont: 'Alice' },
  { name: 'Alike', category: 'Serif', googleFont: 'Alike' },
  { name: 'Alike Angular', category: 'Serif', googleFont: 'Alike+Angular' },
  { name: 'Alkalami', category: 'Serif', googleFont: 'Alkalami' },
  { name: 'Alkatra', category: 'Display', googleFont: 'Alkatra' },
  { name: 'Allan', category: 'Display', googleFont: 'Allan' },
  { name: 'Allerta', category: 'Sans-Serif', googleFont: 'Allerta' },
  { name: 'Allerta Stencil', category: 'Sans-Serif', googleFont: 'Allerta+Stencil' },
  { name: 'Allison', category: 'Display', googleFont: 'Allison' },
  { name: 'Allura', category: 'Display', googleFont: 'Allura' },
  { name: 'Almarai', category: 'Sans-Serif', googleFont: 'Almarai' },
  { name: 'Almendra', category: 'Serif', googleFont: 'Almendra' },
  { name: 'Almendra Display', category: 'Display', googleFont: 'Almendra+Display' },
  { name: 'Almendra SC', category: 'Serif', googleFont: 'Almendra+SC' },
  { name: 'Alumni Sans', category: 'Sans-Serif', googleFont: 'Alumni+Sans' },
  { name: 'Alumni Sans Collegiate One', category: 'Sans-Serif', googleFont: 'Alumni+Sans+Collegiate+One' },
  { name: 'Alumni Sans Inline One', category: 'Display', googleFont: 'Alumni+Sans+Inline+One' },
  { name: 'Alumni Sans Pinstripe', category: 'Sans-Serif', googleFont: 'Alumni+Sans+Pinstripe' },
  { name: 'Amarante', category: 'Display', googleFont: 'Amarante' },
  { name: 'Amaranth', category: 'Sans-Serif', googleFont: 'Amaranth' },
  { name: 'Amatic SC', category: 'Display', googleFont: 'Amatic+SC' },
  { name: 'Amethysta', category: 'Serif', googleFont: 'Amethysta' },
  { name: 'Amiko', category: 'Sans-Serif', googleFont: 'Amiko' },
  { name: 'Amiri', category: 'Serif', googleFont: 'Amiri' },
  { name: 'Amiri Quran', category: 'Serif', googleFont: 'Amiri+Quran' },
  { name: 'Amita', category: 'Display', googleFont: 'Amita' },
  { name: 'Anaheim', category: 'Sans-Serif', googleFont: 'Anaheim' },
  { name: 'Andada Pro', category: 'Serif', googleFont: 'Andada+Pro' },
  { name: 'Andika', category: 'Sans-Serif', googleFont: 'Andika' },
  { name: 'Anek Bangla', category: 'Sans-Serif', googleFont: 'Anek+Bangla' },
  { name: 'Anek Devanagari', category: 'Sans-Serif', googleFont: 'Anek+Devanagari' },
  { name: 'Anek Gujarati', category: 'Sans-Serif', googleFont: 'Anek+Gujarati' },
  { name: 'Anek Gurmukhi', category: 'Sans-Serif', googleFont: 'Anek+Gurmukhi' },
  { name: 'Anek Kannada', category: 'Sans-Serif', googleFont: 'Anek+Kannada' },
  { name: 'Anek Latin', category: 'Sans-Serif', googleFont: 'Anek+Latin' },
  { name: 'Anek Malayalam', category: 'Sans-Serif', googleFont: 'Anek+Malayalam' },
  { name: 'Anek Odia', category: 'Sans-Serif', googleFont: 'Anek+Odia' },
  { name: 'Anek Tamil', category: 'Sans-Serif', googleFont: 'Anek+Tamil' },
  { name: 'Anek Telugu', category: 'Sans-Serif', googleFont: 'Anek+Telugu' },
  { name: 'Angkor', category: 'Display', googleFont: 'Angkor' },
  { name: 'Annie Use Your Telescope', category: 'Display', googleFont: 'Annie+Use+Your+Telescope' },
  { name: 'Anonymous Pro', category: 'Monospace', googleFont: 'Anonymous+Pro' },
  { name: 'Antic', category: 'Sans-Serif', googleFont: 'Antic' },
  { name: 'Antic Didone', category: 'Serif', googleFont: 'Antic+Didone' },
  { name: 'Antic Slab', category: 'Serif', googleFont: 'Antic+Slab' },
  { name: 'Anton', category: 'Sans-Serif', googleFont: 'Anton' },
  { name: 'Antonio', category: 'Sans-Serif', googleFont: 'Antonio' },
  { name: 'Anuphan', category: 'Sans-Serif', googleFont: 'Anuphan' },
  { name: 'Anybody', category: 'Display', googleFont: 'Anybody' },
  { name: 'Aoboshi One', category: 'Serif', googleFont: 'Aoboshi+One' },
  { name: 'Arapey', category: 'Serif', googleFont: 'Arapey' },
  { name: 'Arbutus', category: 'Serif', googleFont: 'Arbutus' },
  { name: 'Arbutus Slab', category: 'Serif', googleFont: 'Arbutus+Slab' },
  { name: 'Architects Daughter', category: 'Display', googleFont: 'Architects+Daughter' },
  { name: 'Archivo', category: 'Sans-Serif', googleFont: 'Archivo' },
  { name: 'Archivo Black', category: 'Sans-Serif', googleFont: 'Archivo+Black' },
  { name: 'Archivo Narrow', category: 'Sans-Serif', googleFont: 'Archivo+Narrow' },
  { name: 'Are You Serious', category: 'Display', googleFont: 'Are+You+Serious' },
  { name: 'Aref Ruqaa', category: 'Serif', googleFont: 'Aref+Ruqaa' },
  { name: 'Aref Ruqaa Ink', category: 'Serif', googleFont: 'Aref+Ruqaa+Ink' },
  { name: 'Arima', category: 'Display', googleFont: 'Arima' },
  { name: 'Arima Madurai', category: 'Display', googleFont: 'Arima+Madurai' },
  { name: 'Arimo', category: 'Sans-Serif', googleFont: 'Arimo' },
  { name: 'Arizonia', category: 'Display', googleFont: 'Arizonia' },
  { name: 'Armata', category: 'Sans-Serif', googleFont: 'Armata' },
  { name: 'Arsenal', category: 'Sans-Serif', googleFont: 'Arsenal' },
  { name: 'Artifika', category: 'Serif', googleFont: 'Artifika' },
  { name: 'Arvo', category: 'Serif', googleFont: 'Arvo' },
  { name: 'Arya', category: 'Sans-Serif', googleFont: 'Arya' },
  { name: 'Asap', category: 'Sans-Serif', googleFont: 'Asap' },
  { name: 'Asap Condensed', category: 'Sans-Serif', googleFont: 'Asap+Condensed' },
  { name: 'Asar', category: 'Serif', googleFont: 'Asar' },
  { name: 'Asset', category: 'Display', googleFont: 'Asset' },
  { name: 'Assistant', category: 'Sans-Serif', googleFont: 'Assistant' },
  { name: 'Astloch', category: 'Display', googleFont: 'Astloch' },
  { name: 'Asul', category: 'Sans-Serif', googleFont: 'Asul' },
  { name: 'Athiti', category: 'Sans-Serif', googleFont: 'Athiti' },
  { name: 'Atkinson Hyperlegible', category: 'Sans-Serif', googleFont: 'Atkinson+Hyperlegible' },
  { name: 'Atma', category: 'Display', googleFont: 'Atma' },
  { name: 'Atomic Age', category: 'Display', googleFont: 'Atomic+Age' },
  { name: 'Aubrey', category: 'Display', googleFont: 'Aubrey' },
  { name: 'Audiowide', category: 'Display', googleFont: 'Audiowide' },
  { name: 'Autour One', category: 'Display', googleFont: 'Autour+One' },
  { name: 'Average', category: 'Serif', googleFont: 'Average' },
  { name: 'Average Sans', category: 'Sans-Serif', googleFont: 'Average+Sans' },
  { name: 'Averia Gruesa Libre', category: 'Display', googleFont: 'Averia+Gruesa+Libre' },
  { name: 'Averia Libre', category: 'Display', googleFont: 'Averia+Libre' },
  { name: 'Averia Sans Libre', category: 'Display', googleFont: 'Averia+Sans+Libre' },
  { name: 'Averia Serif Libre', category: 'Display', googleFont: 'Averia+Serif+Libre' },
  { name: 'Azeret Mono', category: 'Monospace', googleFont: 'Azeret+Mono' },
  { name: 'B612', category: 'Sans-Serif', googleFont: 'B612' },
  { name: 'B612 Mono', category: 'Monospace', googleFont: 'B612+Mono' },
  { name: 'BIZ UDGothic', category: 'Sans-Serif', googleFont: 'BIZ+UDGothic' },
  { name: 'BIZ UDMincho', category: 'Serif', googleFont: 'BIZ+UDMincho' },
  { name: 'BIZ UDPGothic', category: 'Sans-Serif', googleFont: 'BIZ+UDPGothic' },
  { name: 'BIZ UDPMincho', category: 'Serif', googleFont: 'BIZ+UDPMincho' },
  { name: 'Babylonica', category: 'Display', googleFont: 'Babylonica' },
  { name: 'Bacasime Antique', category: 'Serif', googleFont: 'Bacasime+Antique' },
  { name: 'Bad Script', category: 'Display', googleFont: 'Bad+Script' },
  { name: 'Bagel Fat One', category: 'Display', googleFont: 'Bagel+Fat+One' },
  { name: 'Bahiana', category: 'Display', googleFont: 'Bahiana' },
  { name: 'Bahianita', category: 'Display', googleFont: 'Bahianita' },
  { name: 'Bai Jamjuree', category: 'Sans-Serif', googleFont: 'Bai+Jamjuree' },
  { name: 'Bakbak One', category: 'Display', googleFont: 'Bakbak+One' },
  { name: 'Ballet', category: 'Display', googleFont: 'Ballet' },
  { name: 'Baloo 2', category: 'Display', googleFont: 'Baloo+2' },
  { name: 'Baloo Bhai 2', category: 'Display', googleFont: 'Baloo+Bhai+2' },
  { name: 'Baloo Bhaijaan 2', category: 'Display', googleFont: 'Baloo+Bhaijaan+2' },
  { name: 'Baloo Bhaina 2', category: 'Display', googleFont: 'Baloo+Bhaina+2' },
  { name: 'Baloo Chettan 2', category: 'Display', googleFont: 'Baloo+Chettan+2' },
  { name: 'Baloo Da 2', category: 'Display', googleFont: 'Baloo+Da+2' },
  { name: 'Baloo Paaji 2', category: 'Display', googleFont: 'Baloo+Paaji+2' },
  { name: 'Baloo Tamma 2', category: 'Display', googleFont: 'Baloo+Tamma+2' },
  { name: 'Baloo Tammudu 2', category: 'Display', googleFont: 'Baloo+Tammudu+2' },
  { name: 'Baloo Thambi 2', category: 'Display', googleFont: 'Baloo+Thambi+2' },
  { name: 'Balsamiq Sans', category: 'Display', googleFont: 'Balsamiq+Sans' },
  { name: 'Balthazar', category: 'Serif', googleFont: 'Balthazar' },
  { name: 'Bangers', category: 'Display', googleFont: 'Bangers' },
  { name: 'Barlow', category: 'Sans-Serif', googleFont: 'Barlow' },
  { name: 'Barlow Condensed', category: 'Sans-Serif', googleFont: 'Barlow+Condensed' },
  { name: 'Barlow Semi Condensed', category: 'Sans-Serif', googleFont: 'Barlow+Semi+Condensed' },
  { name: 'Barriecito', category: 'Display', googleFont: 'Barriecito' },
  { name: 'Barrio', category: 'Display', googleFont: 'Barrio' },
  { name: 'Basic', category: 'Sans-Serif', googleFont: 'Basic' },
  { name: 'Baskervville', category: 'Serif', googleFont: 'Baskervville' },
  { name: 'Battambang', category: 'Display', googleFont: 'Battambang' },
  { name: 'Baumans', category: 'Display', googleFont: 'Baumans' },
  { name: 'Bayon', category: 'Sans-Serif', googleFont: 'Bayon' },
  { name: 'Be Vietnam Pro', category: 'Sans-Serif', googleFont: 'Be+Vietnam+Pro' },
  { name: 'Beau Rivage', category: 'Display', googleFont: 'Beau+Rivage' },
  { name: 'Bebas Neue', category: 'Sans-Serif', googleFont: 'Bebas+Neue' },
  { name: 'Belanosima', category: 'Sans-Serif', googleFont: 'Belanosima' },
  { name: 'Belgrano', category: 'Serif', googleFont: 'Belgrano' },
  { name: 'Bellefair', category: 'Serif', googleFont: 'Bellefair' },
  { name: 'Belleza', category: 'Sans-Serif', googleFont: 'Belleza' },
  { name: 'Bellota', category: 'Display', googleFont: 'Bellota' },
  { name: 'Bellota Text', category: 'Display', googleFont: 'Bellota+Text' },
  { name: 'BenchNine', category: 'Sans-Serif', googleFont: 'BenchNine' },
  { name: 'Benne', category: 'Serif', googleFont: 'Benne' },
  { name: 'Bentham', category: 'Serif', googleFont: 'Bentham' },
  { name: 'Berkshire Swash', category: 'Display', googleFont: 'Berkshire+Swash' },
  { name: 'Besley', category: 'Serif', googleFont: 'Besley' },
  { name: 'Beth Ellen', category: 'Display', googleFont: 'Beth+Ellen' },
  { name: 'Bevan', category: 'Serif', googleFont: 'Bevan' },
  { name: 'BhuTuka Expanded One', category: 'Serif', googleFont: 'BhuTuka+Expanded+One' },
  { name: 'Big Shoulders Display', category: 'Display', googleFont: 'Big+Shoulders+Display' },
  { name: 'Big Shoulders Inline Display', category: 'Display', googleFont: 'Big+Shoulders+Inline+Display' },
  { name: 'Big Shoulders Inline Text', category: 'Display', googleFont: 'Big+Shoulders+Inline+Text' },
  { name: 'Big Shoulders Stencil Display', category: 'Display', googleFont: 'Big+Shoulders+Stencil+Display' },
  { name: 'Big Shoulders Stencil Text', category: 'Display', googleFont: 'Big+Shoulders+Stencil+Text' },
  { name: 'Big Shoulders Text', category: 'Display', googleFont: 'Big+Shoulders+Text' },
  { name: 'Bigelow Rules', category: 'Display', googleFont: 'Bigelow+Rules' },
  { name: 'Bigshot One', category: 'Display', googleFont: 'Bigshot+One' },
  { name: 'Bilbo', category: 'Display', googleFont: 'Bilbo' },
  { name: 'Bilbo Swash Caps', category: 'Display', googleFont: 'Bilbo+Swash+Caps' },
  { name: 'BioRhyme', category: 'Serif', googleFont: 'BioRhyme' },
  { name: 'BioRhyme Expanded', category: 'Serif', googleFont: 'BioRhyme+Expanded' },
  { name: 'Birthstone', category: 'Display', googleFont: 'Birthstone' },
  { name: 'Birthstone Bounce', category: 'Display', googleFont: 'Birthstone+Bounce' },
  { name: 'Biryani', category: 'Sans-Serif', googleFont: 'Biryani' },
  { name: 'Bitter', category: 'Serif', googleFont: 'Bitter' },
  { name: 'Black And White Picture', category: 'Display', googleFont: 'Black+And+White+Picture' },
  { name: 'Black Han Sans', category: 'Sans-Serif', googleFont: 'Black+Han+Sans' },
  { name: 'Black Ops One', category: 'Display', googleFont: 'Black+Ops+One' },
  { name: 'Blaka', category: 'Display', googleFont: 'Blaka' },
  { name: 'Blaka Hollow', category: 'Display', googleFont: 'Blaka+Hollow' },
  { name: 'Blaka Ink', category: 'Display', googleFont: 'Blaka+Ink' },
  { name: 'Blinker', category: 'Sans-Serif', googleFont: 'Blinker' },
  { name: 'Bodoni Moda', category: 'Serif', googleFont: 'Bodoni+Moda' },
  { name: 'Bokor', category: 'Display', googleFont: 'Bokor' },
  { name: 'Bona Nova', category: 'Serif', googleFont: 'Bona+Nova' },
  { name: 'Bonbon', category: 'Display', googleFont: 'Bonbon' },
  { name: 'Bonheur Royale', category: 'Display', googleFont: 'Bonheur+Royale' },
  { name: 'Boogaloo', category: 'Display', googleFont: 'Boogaloo' },
  { name: 'Borel', category: 'Display', googleFont: 'Borel' },
  { name: 'Bowlby One', category: 'Display', googleFont: 'Bowlby+One' },
  { name: 'Bowlby One SC', category: 'Display', googleFont: 'Bowlby+One+SC' },
  { name: 'Braah One', category: 'Sans-Serif', googleFont: 'Braah+One' },
  { name: 'Brawler', category: 'Serif', googleFont: 'Brawler' },
  { name: 'Bree Serif', category: 'Serif', googleFont: 'Bree+Serif' },
  { name: 'Bricolage Grotesque', category: 'Sans-Serif', googleFont: 'Bricolage+Grotesque' },
  { name: 'Bruno Ace', category: 'Display', googleFont: 'Bruno+Ace' },
  { name: 'Bruno Ace SC', category: 'Display', googleFont: 'Bruno+Ace+SC' },
  { name: 'Brygada 1918', category: 'Serif', googleFont: 'Brygada+1918' },
  { name: 'Bubblegum Sans', category: 'Display', googleFont: 'Bubblegum+Sans' },
  { name: 'Bubbler One', category: 'Sans-Serif', googleFont: 'Bubbler+One' },
  { name: 'Buda', category: 'Display', googleFont: 'Buda' },
  { name: 'Buenard', category: 'Serif', googleFont: 'Buenard' },
  { name: 'Bungee', category: 'Display', googleFont: 'Bungee' },
  { name: 'Bungee Hairline', category: 'Display', googleFont: 'Bungee+Hairline' },
  { name: 'Bungee Inline', category: 'Display', googleFont: 'Bungee+Inline' },
  { name: 'Bungee Outline', category: 'Display', googleFont: 'Bungee+Outline' },
  { name: 'Bungee Shade', category: 'Display', googleFont: 'Bungee+Shade' },
  { name: 'Bungee Spice', category: 'Display', googleFont: 'Bungee+Spice' },
  { name: 'Butcherman', category: 'Display', googleFont: 'Butcherman' },
  { name: 'Butterfly Kids', category: 'Display', googleFont: 'Butterfly+Kids' },
  { name: 'Cabin', category: 'Sans-Serif', googleFont: 'Cabin' },
  { name: 'Cabin Condensed', category: 'Sans-Serif', googleFont: 'Cabin+Condensed' },
  { name: 'Cabin Sketch', category: 'Display', googleFont: 'Cabin+Sketch' },
  { name: 'Caesar Dressing', category: 'Display', googleFont: 'Caesar+Dressing' },
  { name: 'Cagliostro', category: 'Sans-Serif', googleFont: 'Cagliostro' },
  { name: 'Cairo', category: 'Sans-Serif', googleFont: 'Cairo' },
  { name: 'Cairo Play', category: 'Sans-Serif', googleFont: 'Cairo+Play' },
  { name: 'Caladea', category: 'Serif', googleFont: 'Caladea' },
  { name: 'Calistoga', category: 'Display', googleFont: 'Calistoga' },
  { name: 'Calligraffitti', category: 'Display', googleFont: 'Calligraffitti' },
  { name: 'Cambay', category: 'Sans-Serif', googleFont: 'Cambay' },
  { name: 'Cambo', category: 'Serif', googleFont: 'Cambo' },
  { name: 'Candal', category: 'Sans-Serif', googleFont: 'Candal' },
  { name: 'Cantarell', category: 'Sans-Serif', googleFont: 'Cantarell' },
  { name: 'Cantata One', category: 'Serif', googleFont: 'Cantata+One' },
  { name: 'Cantora One', category: 'Sans-Serif', googleFont: 'Cantora+One' },
  { name: 'Caprasimo', category: 'Display', googleFont: 'Caprasimo' },
  { name: 'Capriola', category: 'Sans-Serif', googleFont: 'Capriola' },
  { name: 'Caramel', category: 'Display', googleFont: 'Caramel' },
  { name: 'Carattere', category: 'Display', googleFont: 'Carattere' },
];

const FONT_STORAGE_KEY = 'velocitype_user_font';
const UPLOADED_FONT_KEY = 'velocitype_uploaded_font_data';
const FONT_TYPE_KEY = 'velocitype_font_type'; // 'google' | 'uploaded'

export function getStoredFont(): string {
  return localStorage.getItem(FONT_STORAGE_KEY) || 'Inter';
}

export function getFontType(): 'google' | 'uploaded' {
  return (localStorage.getItem(FONT_TYPE_KEY) as 'google' | 'uploaded') || 'google';
}

export function saveStoredFont(fontName: string): void {
  localStorage.setItem(FONT_STORAGE_KEY, fontName);
  localStorage.setItem(FONT_TYPE_KEY, 'google');
}

export function applyGoogleFont(fontName: string): void {
  if (!fontName) return;

  saveStoredFont(fontName);
  const formattedName = fontName.trim();
  const apiFontName = formattedName.replace(/\s+/g, '+');
  const linkId = 'dynamic-google-font-stylesheet';

  let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = linkId;
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }

  linkEl.href = `https://fonts.googleapis.com/css2?family=${apiFontName}:wght@400;500;600;700;800&display=swap`;

  const styleId = 'dynamic-custom-font-override';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    * {
      font-family: '${formattedName}', system-ui, sans-serif !important;
    }
  `;
}

export function applyUploadedFontFile(fileName: string, dataUrl: string): void {
  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  const format = fileName.endsWith('.woff2')
    ? 'woff2'
    : fileName.endsWith('.woff')
    ? 'woff'
    : fileName.endsWith('.otf')
    ? 'opentype'
    : 'truetype';

  const fontData = { fileName: cleanName, dataUrl, format };
  try {
    localStorage.setItem(UPLOADED_FONT_KEY, JSON.stringify(fontData));
    localStorage.setItem(FONT_TYPE_KEY, 'uploaded');
    localStorage.setItem(FONT_STORAGE_KEY, cleanName);
  } catch (err) {
    console.warn('Font file exceeds localStorage size limit, active for current session.');
  }

  const styleId = 'dynamic-custom-font-override';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @font-face {
      font-family: 'VelocitypeUploadedFont';
      src: url('${dataUrl}') format('${format}');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    * {
      font-family: 'VelocitypeUploadedFont', system-ui, sans-serif !important;
    }
  `;
}

export function getUploadedFontInfo(): { fileName: string; dataUrl: string; format: string } | null {
  const raw = localStorage.getItem(UPLOADED_FONT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function initializeActiveFont(): void {
  const fontType = getFontType();
  if (fontType === 'uploaded') {
    const uploaded = getUploadedFontInfo();
    if (uploaded && uploaded.dataUrl) {
      applyUploadedFontFile(uploaded.fileName, uploaded.dataUrl);
      return;
    }
  }
  const googleFont = getStoredFont();
  applyGoogleFont(googleFont);
}
