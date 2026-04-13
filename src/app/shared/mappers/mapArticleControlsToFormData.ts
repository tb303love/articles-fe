import { AddArticleFormControls } from "../../core/model/article-form.model";

export function mapFormControlsToFormData(controls: AddArticleFormControls): FormData {
  const formData = new FormData();

  // Pripremamo objekat koji odgovara ArticleRequest record-u u Javi
  const articleRequest = {
    name: controls.name.value,
    price: controls.price.value,
    admissionPrice1: controls.admissionPrice1.value,
    admissionPrice2: controls.admissionPrice2.value,
    categoryName: controls.category.value,
    // NOVO: Šaljemo niz serija i rokova
    initialStocks: controls.initialStocks.value.map(s => ({
      quantity: s.quantity,
      expirationDate: s.expirationDate,
      batchNumber: s.batchNumber
    })),
    // NOVO: Šaljemo komponente ako postoje (za Bundle)
    components: controls.components.value.map(c => ({
      componentId: c.componentId,
      quantity: c.quantity
    }))
  };
console.log(articleRequest);
  const articleBlob = new Blob(
    [JSON.stringify(articleRequest)],
    { type: 'application/json' }
  );

  // PAŽNJA: Proveri da li u Java Controlleru stoji @RequestPart("dto") ili @RequestPart("article")
  formData.append('article', articleBlob); 

  const imageFile = controls.image.value;
  if (imageFile) {
    formData.append('image', imageFile, imageFile.name);
  }

  return formData;
}
