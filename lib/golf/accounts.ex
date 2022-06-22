defmodule Golf.Accounts do
  import Ecto.Query, warn: false
  alias Golf.Repo

  alias Golf.Accounts.{User, UserToken}

  ## Database getters

  def get_user(id), do: Repo.get(User, id)

  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_name(name) when is_binary(name) do
    Repo.get_by(User, name: name)
  end

  def get_user_by_name_and_password(name, password)
      when is_binary(name) and is_binary(password) do
    user = Repo.get_by(User, name: name)
    if User.valid_password?(user, password), do: user
  end

  def fetch_user(id) do
    if user = get_user(id) do
      {:ok, user}
    else
      {:error, "user not found"}
    end
  end

  ## User registration

  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def change_user_registration(%User{} = user, attrs \\ %{}) do
    User.registration_changeset(user, attrs, hash_password: false)
  end

  ## Settings

  def change_user_name(user, attrs \\ %{}) do
    User.name_changeset(user, attrs)
  end

  def apply_user_name(user, password, attrs) do
    user
    |> User.name_changeset(attrs)
    |> User.validate_current_password(password)
    |> Ecto.Changeset.apply_action(:update)
  end

  def update_user_name(user, token) do
    context = "change:#{user.name}"

    with {:ok, query} <- UserToken.verify_change_name_token_query(token, context),
         %UserToken{sent_to: name} <- Repo.one(query),
         {:ok, _} <- Repo.transaction(user_name_multi(user, name, context)) do
      :ok
    else
      _ -> :error
    end
  end

  defp user_name_multi(user, name, context) do
    changeset =
      user
      |> User.name_changeset(%{name: name})

    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, changeset)
    |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, [context]))
  end

  def change_user_password(user, attrs \\ %{}) do
    User.password_changeset(user, attrs, hash_password: false)
  end

  def update_user_password(user, password, attrs) do
    changeset =
      user
      |> User.password_changeset(attrs)
      |> User.validate_current_password(password)

    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, changeset)
    |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{user: user}} -> {:ok, user}
      {:error, :user, changeset, _} -> {:error, changeset}
    end
  end

  def update_user_current_game(user, game_id) do
    user
    |> User.current_game_changeset(%{current_game: game_id})
    |> Repo.update()
  end

  ## Session

  def generate_user_session_token(user) do
    {token, user_token} = UserToken.build_session_token(user)
    Repo.insert!(user_token)
    token
  end

  def get_user_by_session_token(token) do
    {:ok, query} = UserToken.verify_session_token_query(token)
    Repo.one(query)
  end

  def delete_session_token(token) do
    Repo.delete_all(UserToken.token_and_context_query(token, "session"))
    :ok
  end

  def confirm_user(token) do
    with {:ok, query} <- UserToken.verify_name_token_query(token, "confirm"),
         %User{} = user <- Repo.one(query),
         {:ok, %{user: user}} <- Repo.transaction(confirm_user_multi(user)) do
      {:ok, user}
    else
      _ -> :error
    end
  end

  defp confirm_user_multi(user) do
    Ecto.Multi.new()
    |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, ["confirm"]))
  end

  def get_user_by_reset_password_token(token) do
    with {:ok, query} <- UserToken.verify_name_token_query(token, "reset_password"),
         %User{} = user <- Repo.one(query) do
      user
    else
      _ -> nil
    end
  end

  def reset_user_password(user, attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, User.password_changeset(user, attrs))
    |> Ecto.Multi.delete_all(:tokens, UserToken.user_and_contexts_query(user, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{user: user}} -> {:ok, user}
      {:error, :user, changeset, _} -> {:error, changeset}
    end
  end

  def leave_current_game(%{current_game: game_id} = user) when is_binary(game_id) do
    {:ok, user} = update_user_current_game(user, nil)

    case Golf.GameServer.remove_player(game_id, user.id) do
      {:ok, game} ->
        msg = "Player #{user.name} has left."
        GolfWeb.broadcast_game_update(game, msg)
        {:ok, user}

      _ ->
        {:ok, user}
    end
  end

  def leave_current_game(user), do: {:ok, user}
end
