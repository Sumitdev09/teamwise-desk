-- Update the handle_new_user trigger function to insert default employee role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  
  -- Insert default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee'::app_role);
  
  RETURN NEW;
END;
$function$;