interface AnnotationProperties {
    title: string| null ;
    description: string| null ;
    video?: string | null;
    picture?: string | null;
    meta?: any | null;
}

class Annotation {
    private id: number | null = null;
    private dataset: string | null = null;
    private geometry: any| null = null;
    private properties: AnnotationProperties  = {
        title: null,
        description: null
    }

    getId(): number | null {
        return this.id;
    }

    setId(value: number | null) {
        this.id = value;
    }

    getGeometry(): any {
        return this.geometry;
    }

    setGeometry(value: any) {
        this.geometry = value;
    }

    getProperties(): AnnotationProperties {
        return this.properties;
    }

    setProperties(value: AnnotationProperties) {
        this.properties = value;
    }

    getDataset(): string | null {
        return this.dataset;
    }

    setDataset(value: string | null) {
        this.dataset = value;
    }
}

export {
    Annotation,
    AnnotationProperties
}