export type CareProvidersGroup = {
    region: string;
    regionCode: string;
    county: string;
    countyCode: string;
    fieldOfCare: string;
    count: number;
};

export type CareProvider = {
    MistoPoskytovaniId: string;
    ZdravotnickeZarizeniId: string;
    Kod: string;
    NazevZarizeni: string;
    DruhZarizeni: string;
    Obec: string;
    Psc: string;
    Ulice: string;
    CisloDomovniOrientacni: string;
    Kraj: string;
    KrajCode: string;
    Okres: string;
    OkresCode: string;
    SpravniObvod: string;
    PoskytovatelTelefon: string;
    PoskytovatelFax: string;
    PoskytovatelEmail: string;
    PoskytovatelWeb: string;
    Ico: string;
    TypOsoby: string;
    PravniFormaKod: string;
    KrajCodeSidlo: string;
    OkresCodeSidlo: string;
    ObecSidlo: string;
    PscSidlo: string;
    UliceSidlo: string;
    CisloDomovniOrientacniSidlo: string;
    OborPece: string;
    FormaPece: string;
    DruhPece: string;
    OdbornyZastupce: string;
    Lat: string;
    Lng: string;
};

export type PopulationRecord = {
    idhod: string;
    hodnota: string;
    vuk: string;
    vuk_text: string;
    stapro_kod: string;
    /** Value 101 represents a county, value 100 represents a region. */
    vuzemi_cis: string;
    /** County code can be translated to NUTS county code using code mapping from county-codes.csv */
    vuzemi_kod: string;
    rok: string;
    casref_od: string;
    casref_do: string;
    vuzemi_txt: string;
};

export type CountyCodeRecord = {
    KODJAZ: string;
    TYPVAZ: string;
    AKRCIS1: string;
    KODCIS1: string;
    /** County NUTS code */
    CHODNOTA1: string;
    TEXT1: string;
    AKRCIS2: string;
    KODCIS2: string;
    /** County code same as in 'population-cs-2021.csv' */
    CHODNOTA2: string;
    TEXT2: string;
}