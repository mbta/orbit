defmodule Orbit.Import.CertificationsTest do
  use Orbit.DataCase
  import Ecto.Query

  alias Orbit.Certification
  alias Orbit.Import.ImportCertifications
  alias Orbit.Repo

  describe "import_csv_rows!" do
    test "drops csv header" do
      rows =
        String.split(
          "Report Title:,Rail Certifications
      Report Created By:,\"Account, Test\"

      User - User ID,Certifications - Certification Title,Certifications - Certification Period Expiration Date
      01234,BRIDGE Recert - Motorperson - BL,06/22/2025 10:00 PM",
          "\n"
        )

      ImportCertifications.import_csv_rows!(rows, :rail)

      assert [
               %Certification{
                 badge: "1234",
                 rail_line: :blue,
                 expires: ~D[2025-06-22]
               }
             ] = Repo.all(from(c in Certification))
    end
  end

  describe "import!" do
    test "imports certifications" do
      rows = [
        %{
          "User - User ID" => "01234",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - BL",
          "Certifications - Certification Period Expiration Date" => "06/22/2025 10:00 PM"
        },
        %{
          "User - User ID" => "01235",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - OL",
          "Certifications - Certification Period Expiration Date" => "05/22/2025 10:00 PM"
        },
        %{
          "User - User ID" => "01236",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - RL",
          "Certifications - Certification Period Expiration Date" => "04/22/2025 10:00 PM"
        }
      ]

      ImportCertifications.import!(rows, :rail)

      assert [
               %Certification{
                 badge: "1234",
                 type: :rail,
                 rail_line: :blue,
                 expires: ~D[2025-06-22]
               },
               %Certification{
                 badge: "1235",
                 type: :rail,
                 rail_line: :orange,
                 expires: ~D[2025-05-22]
               },
               %Certification{
                 badge: "1236",
                 type: :rail,
                 rail_line: :red,
                 expires: ~D[2025-04-22]
               }
             ] = Repo.all(from(c in Certification, order_by: [desc: :expires]))
    end

    test "chooses the latest expiry within each line" do
      rows = [
        %{
          "User - User ID" => "01234",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - BL",
          "Certifications - Certification Period Expiration Date" => "06/22/2025 10:00 PM"
        },
        %{
          "User - User ID" => "01234",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - BL",
          "Certifications - Certification Period Expiration Date" => "10/22/2025 10:00 PM"
        },
        %{
          "User - User ID" => "01234",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - RL",
          "Certifications - Certification Period Expiration Date" => "04/22/2025 10:00 PM"
        },
        %{
          "User - User ID" => "01235",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson - RL",
          "Certifications - Certification Period Expiration Date" => "04/22/2025 10:00 PM"
        }
      ]

      ImportCertifications.import!(rows, :rail)

      assert [
               %Certification{
                 badge: "1234",
                 rail_line: :blue,
                 expires: ~D[2025-10-22]
               },
               %Certification{
                 badge: "1234",
                 rail_line: :red,
                 expires: ~D[2025-04-22]
               },
               %Certification{
                 badge: "1235",
                 rail_line: :red,
                 expires: ~D[2025-04-22]
               }
             ] = Repo.all(from(c in Certification, order_by: [desc: :expires]))
    end

    test "missing rail line becomes :none" do
      rows = [
        %{
          "User - User ID" => "01234",
          "Certifications - Certification Title" => "BRIDGE Recert - Motorperson",
          "Certifications - Certification Period Expiration Date" => "06/22/2025 10:00 PM"
        }
      ]

      ImportCertifications.import!(rows, :rail)

      assert [
               %Certification{
                 rail_line: :none
               }
             ] = Repo.all(from(c in Certification))
    end
  end
end
