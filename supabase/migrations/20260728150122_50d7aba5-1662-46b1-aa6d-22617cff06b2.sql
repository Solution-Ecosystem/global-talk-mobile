CREATE TABLE public.gift_items (
  id uuid primary key default gen_random_uuid(),
  gallery text not null check (gallery in ('D','C','B','A')),
  name text not null,
  lit boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.gift_items TO anon;
GRANT SELECT ON public.gift_items TO authenticated;
GRANT ALL ON public.gift_items TO service_role;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_items public read" ON public.gift_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.gift_state (
  id int primary key default 1,
  current_gallery text not null default 'D' check (current_gallery in ('D','C','B','A')),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.gift_state TO anon;
GRANT SELECT ON public.gift_state TO authenticated;
GRANT ALL ON public.gift_state TO service_role;
ALTER TABLE public.gift_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_state public read" ON public.gift_state FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.gift_state (id, current_gallery) VALUES (1, 'D');

INSERT INTO public.gift_items (gallery, name, lit, position) VALUES
('D','Rosa',true,1),('D','TikTok',true,2),('D','Dedo de Coração',false,3),('D','Mãozinha',false,4),('D','Sorvete',false,5),('D','Bolo',false,6),
('C','Ursinho',false,1),('C','Chapéu de Festa',false,2),('C','Perfume',false,3),('C','Cisne',false,4),('C','Coroa',false,5),('C','Buquê',false,6),
('B','Bola de Discoteca',false,1),('B','Guitarra',false,2),('B','Moto',false,3),('B','Leão Mini',false,4),('B','Foguete',false,5),('B','Iate',false,6),
('A','Leão',false,1),('A','Universo',false,2),('A','TikTok Universe',false,3),('A','Castelo',false,4),('A','Phoenix',false,5),('A','Dragão',false,6);