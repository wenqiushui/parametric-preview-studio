
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useModelContext } from '@/context/ModelContext';
import { getAllPrototypes } from '@/utils/modelPrototypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Package } from 'lucide-react';

const ModelSelector: React.FC = () => {
  const { addModel } = useModelContext();
  const prototypes = getAllPrototypes();
  
  // Group prototypes by category
  const categories = prototypes.reduce((acc, prototype) => {
    if (!acc[prototype.category]) {
      acc[prototype.category] = [];
    }
    acc[prototype.category].push(prototype);
    return acc;
  }, {} as Record<string, typeof prototypes>);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary" />
          Available Models
        </CardTitle>
        <CardDescription>
          Select a model to add to your scene
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-4">
          {Object.entries(categories).map(([category, prototypes]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {prototypes.map((prototype) => (
                  <Card key={prototype.id} className="hover-scale overflow-hidden bg-accent/50 border border-accent">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-md">{prototype.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <p className="text-xs text-muted-foreground">{prototype.description}</p>
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-end">
                      <Button 
                        size="sm" 
                        className="rounded-full h-8 px-3"
                        onClick={() => addModel(prototype)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
