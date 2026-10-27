import { ArticleFormModel } from "../../core/model/article-form.model";

export function mapArticleModelToFormData(value: ArticleFormModel): FormData {
  const formData = new FormData();

  const toLocalYMD = (date: any) => {
    if (!date) return null;

    // Ako je string, pokušaj da ga pretvoriš u Date objekat
    let d = date;
    if (!(d instanceof Date)) {
      d = new Date(date);
    }

    // Proveri da li je konverzija uspela (da li je validan datum)
    if (isNaN(d.getTime())) {
      // Ako konverzija nije uspela, ali je string u formatu YYYY-MM-DD, vrati ga takvog
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        return date.split('T')[0];
      }
      return null;
    }

    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Tip artikla određuje šta se šalje: bundle -> komponente, običan -> zalihe
  const isBundle = value.isBundle;

  const articleRequest = {
    name: value.name,
    price: value.price,
    barcodes: value.barcodes,
    active: value.active,
    admissionPrice1: value.admissionPrice1,
    admissionPrice2: value.admissionPrice2,
    categoryName: value.category || null,

    initialStocks: isBundle ? null : value.initialStocks.map(s => ({
      quantity: s.quantity,
      expirationDate: toLocalYMD(s.expirationDate),
      batchNumber: s.batchNumber
    })),

    components: isBundle ? value.components.map(c => ({
      componentId: c.componentId,
      quantity: c.quantity
    })) : null
  };

  const articleBlob = new Blob(
    [JSON.stringify(articleRequest)],
    { type: 'application/json' }
  );

  formData.append('article', articleBlob);

  const imageFile = value.image;
  if (imageFile instanceof File) {
    formData.append('image', imageFile, imageFile.name);
  }

  return formData;
}
