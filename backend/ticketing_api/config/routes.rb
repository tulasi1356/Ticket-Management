Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"


  resources :users do 
    collection do
      post :create
      get :index
      get :find_by_email
      get :search
    end
  end


  resource :projects do
    collection do
      post :create
      get :index 
      post :assign_users_to_project
      put :edit_project
      get :get_project
      delete :destroy_project
    end
  end


  resources :sprints do
    collection do
      post :create
      get :index
    end
  end


  resources :tickets do
    collection do
      post :create
      get :index
      post :export
    end
  end

  post "attachments/upload", to: "attachments#create"
  get "attachments/disk/:filename", to: "attachments#show_disk", constraints: { filename: /[^\/]+/ }

  resources :comments, only: [:index, :create]

end
