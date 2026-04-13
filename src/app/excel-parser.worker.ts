/// <reference lib="webworker" />
import * as XLSX from 'xlsx';
const REQUIRED_HEADERS = [
  'Ime artikla',
  'Tip',
  'Prodajna cena',
  'Zaliha',
  'Ulazna cena 1',
  'Ulazna cena 2',
];

addEventListener(
  'message',
  ({ data }: { data: { buffer: ArrayBuffer; existingNames: string[] } }) => {
    try {
      const workbook = XLSX.read(data.buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true }) as any[];

      if (jsonData.length > 0) {
        const fileHeaders = Object.keys(jsonData[0]);
        const missingHeaders = REQUIRED_HEADERS.filter((h) => !fileHeaders.includes(h));

        if (missingHeaders.length > 0) {
          postMessage({
            success: false,
            error: `Neispravan format fajla. Nedostaju kolone: ${missingHeaders.join(', ')}`,
          });
          return; // Prekidamo rad workera odmah
        }
      } else {
        postMessage({ success: false, error: 'Fajl je prazan.' });
        return;
      }

      const validArticles: any[] = [];
      const validationErrors: any[] = [];
      let newCount = 0;
      let updateCount = 0;

      const namesSet = new Set((data.existingNames || []).map((n) => n.toLowerCase().trim()));

      // ROBUSTNI PARSER: Čisti razmake i forsira tačku kao separator
      const parseNumber = (val: any): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;

        // Brišemo razmake i sve što nije broj, tačka ili minus
        const cleanVal = val
          .toString()
          .trim()
          .replace(/[^\d.-]/g, '');
        const num = parseFloat(cleanVal);
        return isNaN(num) ? 0 : num;
      };

      jsonData.forEach((item: any, index: number) => {
        const rowNum = index + 2;
        const errors: string[] = [];

        const name = item['Ime artikla']?.toString().trim();
        const category = item['Tip']?.toString().trim();

        // Parsiranje sa čišćenjem stringova
        const price = parseNumber(item['Prodajna cena']);
        const admission1 = parseNumber(item['Ulazna cena 1']);
        const admission2 = parseNumber(item['Ulazna cena 2']);
        const stock = parseNumber(item['Zaliha']);

        if (!name || name.length < 3) {
          errors.push('Ime artikla je obavezno i mora imati bar 3 karaktera.');
        }
        if (price < 0) {
          errors.push('Prodajna cena mora biti pozitivan broj.');
        }

        if (admission1 < 0) {
          errors.push('Ulazna cena 1 mora biti pozitivan broj.');
        }

        if (admission2 < 0) {
          errors.push('Ulazna cena 2 mora biti pozitivan broj.');
        }

        if (errors.length === 0) {
          // MAPIRANJE: Koristimo initialStock za tvoj novi Backend Record
          const mappedArticle = {
            name: name,
            price: price,
            admissionPrice1: admission1,
            admissionPrice2: admission2,
            initialStock: Math.floor(stock), // Backend očekuje Integer
            category: category,
          };

          if (namesSet.has(name.toLowerCase())) {
            updateCount++;
          } else {
            newCount++;
          }
          validArticles.push(mappedArticle);
        } else {
          validationErrors.push({
            row: rowNum,
            itemName: name || 'Nepoznato',
            reasons: errors,
          });
        }
      });

      postMessage({
        success: true,
        articles: validArticles,
        errors: validationErrors,
        stats: {
          new: newCount,
          update: updateCount,
          totalInFile: jsonData.length,
          valid: validArticles.length,
        },
      });
    } catch (error: any) {
      postMessage({ success: false, error: 'Greška pri čitanju fajla.' });
    }
  },
);
