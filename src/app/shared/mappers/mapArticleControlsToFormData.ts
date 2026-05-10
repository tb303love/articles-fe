import { AddArticleFormControls } from "../../core/model/article-form.model";

export function mapFormControlsToFormData(controls: AddArticleFormControls): FormData {
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


  // 1. Proveravamo status kontrola da odredimo tip artikla
  const isBundle = controls.components.enabled;
  const isRegular = controls.initialStocks.enabled;

  const articleRequest = {
    name: controls.name.value,
    price: controls.price.value,
    barcodes: controls.barcodes.value,
    active: controls.active.value,
    admissionPrice1: controls.admissionPrice1.value,
    admissionPrice2: controls.admissionPrice2.value,
    categoryName: controls.category.value,

    // Ako su zalihe disabled, šaljemo null bez obzira na to šta piše u njima
    initialStocks: isRegular ? controls.initialStocks.value.map(s => ({
      quantity: s.quantity,
      expirationDate: toLocalYMD(s.expirationDate),
      batchNumber: s.batchNumber
    })) : null,

    // Ako su komponente disabled, šaljemo null
    components: isBundle ? controls.components.value.map(c => ({
      componentId: c.componentId,
      quantity: c.quantity
    })) : null
  };

  const articleBlob = new Blob(
    [JSON.stringify(articleRequest)],
    { type: 'application/json' }
  );

  formData.append('article', articleBlob);

  const imageFile = controls.image.value;
  if (imageFile instanceof File) {
    formData.append('image', imageFile, imageFile.name);
  }

  return formData;
}

